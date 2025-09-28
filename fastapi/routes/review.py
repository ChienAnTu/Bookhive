import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.dependencies import get_db, get_current_user
from models.user import User as UserModel
from models.review import Review
from services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# -------- Helper: manual response builders --------

def _review_to_dict(review: Review) -> dict:
    return {
        "id": review.id,
        "orderId": review.order_id,
        "reviewerId": review.reviewer_id,
        "revieweeId": review.reviewee_id,
        "rating": review.rating,
        "comment": review.comment,
        "createdAt": review.created_at.isoformat(),
    }

# -------- Routes --------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_review(
    order_id: str,
    reviewee_id: str,
    rating: int,
    comment: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Create a review for an order"""
    review = await review_service.create_review(
        db, order_id, current_user.user_id, reviewee_id, rating, comment
    )
    return _review_to_dict(review)


@router.get("/user/{user_id}", status_code=status.HTTP_200_OK)
def get_reviews_for_user(user_id: str, db: Session = Depends(get_db)):
    """Get all reviews received by a user"""
    reviews = review_service.get_reviews_by_user(db, user_id)
    return [_review_to_dict(r) for r in reviews]


@router.get("/order/{order_id}", status_code=status.HTTP_200_OK)
def get_reviews_for_order(order_id: str, db: Session = Depends(get_db)):
    """Get all reviews for a specific order"""
    reviews = review_service.get_reviews_by_order(db, order_id)
    return [_review_to_dict(r) for r in reviews]


@router.get("/user/{user_id}/rating", status_code=status.HTTP_200_OK)
def get_user_rating_summary(user_id: str, db: Session = Depends(get_db)):
    """Get rating summary (average, total, distribution) for a user"""
    return review_service.get_user_rating_summary(db, user_id)


@router.get("/reviewer/{user_id}", status_code=status.HTTP_200_OK)
def get_reviews_by_reviewer(user_id: str, db: Session = Depends(get_db)):
    """Get all reviews written by a reviewer"""
    reviews = review_service.get_reviews_by_reviewer(db, user_id)
    return [_review_to_dict(r) for r in reviews]