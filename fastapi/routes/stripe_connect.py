# fastapi/routes/stripe_connect.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, Literal
import stripe

from core.config import settings
from core.dependencies import get_db
from models.user import User

router = APIRouter(prefix="/stripe", tags=["Stripe Connect"])

# ---------- Request / Response Schemas ----------

class CreateOnboardingLinkRequest(BaseModel):
    userId: str = Field(..., description="The lender/seller's user_id")
    # If omitted, the backend will automatically generate default URLs (supports http://localhost)
    refreshUrl: Optional[str] = Field(None, description="Onboarding interrupted/return page")
    returnUrl: Optional[str]  = Field(None,  description="Page to return to after onboarding completes")
    country: Optional[str]    = Field("AU", description="Account country (default AU)")

    # New: choose which type of link to create; if omitted = onboarding (backward compatible behavior)
    # Stripe supported link types documentation: https://docs.stripe.com/connect/account-links
    linkType: Literal["account_onboarding", "account_update"] = Field(
        "account_onboarding",
        description="Create Onboarding (default) or create Update information link"
    )

class CreateOnboardingLinkResponse(BaseModel):
    accountId: str
    onboardingUrl: str
    linkType: str

class AccountStatusResponse(BaseModel):
    userId: str
    accountId: Optional[str]
    onboardingStatus: str
    detailsSubmitted: bool
    payoutsEnabled: bool
    requirementsDue: Optional[str] = None

class DeleteAccountResponse(BaseModel):
    userId: str
    accountId: str
    deleted: bool

# ---------- Helpers ----------

def _bool_to_str(b: bool) -> str:
    return "true" if b else "false"

def _default_redirects(request: Request) -> tuple[str, str]:
    """
    Generate refresh/return URLs that can be used for local testing.
    Priority:
      1) FRONTEND_URL (if frontend exists)
      2) API_PUBLIC_URL
      3) request.base_url (Swagger at port 8000)
    All point to the two redirect endpoints defined below:
      GET /stripe/onboarding/refresh
      GET /stripe/onboarding/return
    """
    base_front = (settings.FRONTEND_URL or "").rstrip("/")
    base_api   = (settings.API_PUBLIC_URL or "").rstrip("/")
    base_swagger = str(request.base_url).rstrip("/")

    base = base_front or base_api or base_swagger
    refresh = f"{base}/stripe/onboarding/refresh"
    ret     = f"{base}/stripe/onboarding/return"
    return refresh, ret

def _get_user(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ---------- Routes ----------

@router.post("/account_links", response_model=CreateOnboardingLinkResponse, status_code=status.HTTP_201_CREATED)
def create_or_refresh_onboarding_link(
    body: CreateOnboardingLinkRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Create (or refresh) a Stripe Connect Express link:
    - linkType = 'account_onboarding': first time or incomplete → generate Onboarding link
    - linkType = 'account_update': existing account updating details → generate Update link
    - If refreshUrl / returnUrl are omitted, backend will auto-fill with usable default URLs (supports http://localhost)
    - Onboarding URL is one-time use and short-lived (about 30 minutes); if interrupted or expired, call this API again to get a new URL
    """
    # 1) Find user
    user = _get_user(db, body.userId)

    # 2) Retrieve or create connected account
    acct_id = user.stripe_account_id
    if not acct_id:
        if body.linkType == "account_update":
            # No account exists yet but update link requested → error (prevent misuse)
            raise HTTPException(status_code=400, detail="No connected account yet. Use 'account_onboarding' first.")
        # Create Express account
        try:
            account = stripe.Account.create(
                type="express",
                country=(body.country or "AU"),
                email=user.email,
                capabilities={
                    "transfers": {"requested": True},
                    "card_payments": {"requested": True},
                },
            )
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Create account failed: {str(e)}")

        user.stripe_account_id = account["id"]
        user.stripe_onboarding_status = "incomplete"
        user.stripe_details_submitted = _bool_to_str(account.get("details_submitted", False))
        user.stripe_payouts_enabled   = _bool_to_str(account.get("payouts_enabled", False))
        requirements = account.get("requirements", {})
        due = requirements.get("currently_due") or []
        user.stripe_requirements_due = ",".join(due) if isinstance(due, list) else str(due)
        db.commit()
        db.refresh(user)
        acct_id = user.stripe_account_id

    # 3) Default redirect URLs
    refresh_url = body.refreshUrl
    return_url  = body.returnUrl
    if not refresh_url or not return_url:
        _refresh, _return = _default_redirects(request)
        refresh_url = refresh_url or _refresh
        return_url  = return_url  or _return

    # 4) Create Stripe AccountLink
    try:
        link = stripe.AccountLink.create(
            account=acct_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type=body.linkType  # 'account_onboarding' | 'account_update'
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Create account link failed: {str(e)}")

    return CreateOnboardingLinkResponse(
        accountId=acct_id,
        onboardingUrl=link["url"],
        linkType=body.linkType,
    )

@router.get("/account/{user_id}/status", response_model=AccountStatusResponse, status_code=status.HTTP_200_OK)
def get_account_status(user_id: str, db: Session = Depends(get_db)):
    """
    Query and sync a user's Stripe Connect account status.
    """
    user = _get_user(db, user_id)

    if not user.stripe_account_id:
        return AccountStatusResponse(
            userId=user_id,
            accountId=None,
            onboardingStatus="not_started",
            detailsSubmitted=False,
            payoutsEnabled=False,
            requirementsDue=None,
        )

    try:
        account = stripe.Account.retrieve(user.stripe_account_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Retrieve account failed: {str(e)}")

    details_submitted = bool(account.get("details_submitted", False))
    payouts_enabled   = bool(account.get("payouts_enabled", False))
    requirements = account.get("requirements", {})
    due = requirements.get("currently_due") or []
    requirements_due = ",".join(due) if isinstance(due, list) else str(due)

    user.stripe_details_submitted = _bool_to_str(details_submitted)
    user.stripe_payouts_enabled   = _bool_to_str(payouts_enabled)
    user.stripe_requirements_due  = requirements_due
    user.stripe_onboarding_status = "complete" if (details_submitted and payouts_enabled) else "incomplete"
    db.commit()
    db.refresh(user)

    return AccountStatusResponse(
        userId=user_id,
        accountId=user.stripe_account_id,
        onboardingStatus=user.stripe_onboarding_status or "incomplete",
        detailsSubmitted=details_submitted,
        payoutsEnabled=payouts_enabled,
        requirementsDue=requirements_due or None,
    )

@router.delete("/account/{user_id}", response_model=DeleteAccountResponse, status_code=status.HTTP_200_OK)
def delete_connected_account(user_id: str, db: Session = Depends(get_db)):
    """
    Delete a user's Stripe Connected Account (irreversible):
    - Calls Stripe DELETE /v1/accounts/{account_id}
    - Cleans up corresponding DB fields (stripe_account_id etc.)
    - Note: If Stripe has pending funds or restrictions, deletion may be denied
    """
    user = _get_user(db, user_id)

    acct_id = user.stripe_account_id
    if not acct_id:
        raise HTTPException(status_code=404, detail="No connected account to delete")

    try:
        deleted_obj = stripe.Account.delete(acct_id)  # Returns {'id': 'acct_...', 'deleted': True}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Delete account failed: {str(e)}")

    # Clean up DB fields (safe: if your users table doesn’t have these fields, it won’t break deletion)
    user.stripe_account_id = None
    # Skip if fields don’t exist (assuming your User model has them, this code remains safe)
    for fld, val in [
        ("stripe_onboarding_status", "not_started"),
        ("stripe_details_submitted", "false"),
        ("stripe_payouts_enabled", "false"),
        ("stripe_requirements_due", None),
    ]:
        if hasattr(user, fld):
            setattr(user, fld, val)

    db.commit()
    db.refresh(user)

    return DeleteAccountResponse(
        userId=user_id,
        accountId=acct_id,
        deleted=bool(deleted_obj.get("deleted", False)),
    )

# ---------- Dev-only: two simple redirect endpoints (convenient for Swagger testing) ----------
@router.get("/onboarding/refresh")
def onboarding_refresh():
    return {
        "message": "Stripe onboarding was refreshed or interrupted. You can re-initiate the process from your app.",
        "ok": True
    }

@router.get("/onboarding/return")
def onboarding_return():
    return {
        "message": "Stripe onboarding finished (return URL reached). You can safely close this tab.",
        "ok": True
    }
