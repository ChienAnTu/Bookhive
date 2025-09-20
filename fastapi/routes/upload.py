import uuid
import io
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Form
from PIL import Image
from core.dependencies import get_current_user
from models.user import User as UserModel

router = APIRouter(prefix="/upload", tags=["Upload"])

MEDIA_ROOT = Path(__file__).resolve().parent.parent / "media"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

MAX_SIZE   = 2 * 1024 * 1024  # 2MB
ALLOWEDEXT = {"png", "jpg", "jpeg", "gif", "webp"}

def _detect_image_ext(data: bytes) -> str | None:
    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or "").lower()
        return "jpg" if fmt == "jpeg" else fmt
    except Exception:
        return None

def _safe_segment(s: str) -> str:
    return "".join(ch for ch in s if ch.isalnum() or ch in "-_") or "user"


@router.post("/image", status_code=status.HTTP_201_CREATED, summary="Upload Image", description="Upload image to /media/{user_id}/{scene}/. Returns public path like /media/{user_id}/{scene}/{filename}")
async def upload_file(
    file: UploadFile = File(..., description="The image file to upload (formats: png, jpg, jpeg, gif, webp). Max 2MB."),
    scene: str = Form(..., description="The functional context for the file (e.g., 'profile', 'book'). Used to categorize files."),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Upload image to /media/{user_id}/{scene}/
    Returns public path like /media/{user_id}/{scene}/{filename}
    """
    content = await file.read()

    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (>2MB)")

    ext = _detect_image_ext(content)
    if ext not in ALLOWEDEXT:
        raise HTTPException(status_code=400, detail="Unsupported or invalid image")

    user_id = _safe_segment(current_user.user_id)
    scene = _safe_segment(scene)

    upload_dir = MEDIA_ROOT / user_id / scene
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = upload_dir / filename
    save_path.write_bytes(content)

    public_path = f"/media/{user_id}/{scene}/{filename}"
    return {
        "path": public_path,
        "filename": filename,
        "scene": scene,
    }