# app/routes/upload.py
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from PIL import Image
import io
from core.dependencies import get_current_user, get_db
from models.user import User as UserModel

router = APIRouter(prefix="/upload", tags=["Upload"])

# Root directory for media; /media is mounted in main.py
PROFILE_PICTURE_ROOT = Path(__file__).resolve().parent.parent / "media" / "profilePicture"
PROFILE_PICTURE_ROOT.mkdir(parents=True, exist_ok=True)

MAX_SIZE   = 2 * 1024 * 1024  # 2MB
ALLOWEDEXT = {"png", "jpg", "jpeg", "gif", "webp"}

def _detect_image_ext(data: bytes) -> str | None:
    """Detect image extension using Pillow; return lower-case ext like 'png', 'jpg', 'webp'."""
    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or "").lower()
        return "jpg" if fmt == "jpeg" else fmt
    except Exception:
        return None

def _safe_segment(s: str) -> str:
    """Make directory/file segment safe: keep alnum, dash, underscore only."""
    return "".join(ch for ch in s if ch.isalnum() or ch in "-_") or "user"

@router.post("/profile-picture", status_code=status.HTTP_201_CREATED)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Upload the current user's profile picture.
    - Saves to /media/profilePicture/{user_id}/
    - Returns a public path like /media/profilePicture/{user_id}/{filename}
    """
    # Read file bytes
    content = await file.read()

    # Size guard
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (>2MB)")

    # Type check
    ext = _detect_image_ext(content)
    if ext not in ALLOWEDEXT:
        raise HTTPException(status_code=400, detail="Unsupported or invalid image")

    # Per-user directory
    user_id = _safe_segment(current_user.user_id)
    user_dir = PROFILE_PICTURE_ROOT / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    # Unique filename (you can switch to fixed name to overwrite old pictures)
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = user_dir / filename
    save_path.write_bytes(content)

    public_path = f"/media/profilePicture/{user_id}/{filename}"
    return {"path": public_path}