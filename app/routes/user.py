from fastapi import APIRouter
from app.models.user import User
from app.services import user

router = APIRouter()

@router.get("/users", response_model=list[User])
def list_users():
    return user.get_users()

@router.post("/users", response_model=User)
def add_user(u: User):
    return user.create_user(u)