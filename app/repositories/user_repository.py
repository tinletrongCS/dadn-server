# app/repositories/user_repository.py

from sqlalchemy.orm import Session
from models.domain_models import User


def get_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id) -> User | None:
    return db.query(User).filter(User.user_id == user_id).first()


def create(
    db: Session,
    username: str,
    email: str,
    password_hash: str,
    full_name: str,
    role_id: int,
) -> User:
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role_id=role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
