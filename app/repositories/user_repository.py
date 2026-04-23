# app/repositories/user_repository.py

from typing import List
from sqlalchemy.orm import Session
from models.domain_models import User


def get_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id) -> User | None:
    return db.query(User).filter(User.user_id == user_id).first()


def get_all(db: Session) -> List[User]:
    return db.query(User).order_by(User.created_at.asc()).all()


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


def update_full_name(db: Session, user_id, full_name: str) -> User | None:
    user = get_by_id(db, user_id)
    if not user:
        return None
    user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user


def update_status(db: Session, user_id, is_active: bool) -> User | None:
    user = get_by_id(db, user_id)
    if not user:
        return None
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def update_role(db: Session, user_id, role_id: int) -> User | None:
    user = get_by_id(db, user_id)
    if not user:
        return None
    user.role_id = role_id
    db.commit()
    db.refresh(user)
    return user


def admin_update(db: Session, user_id, full_name: str | None, is_active: bool | None, role_id: int | None) -> User | None:
    user = get_by_id(db, user_id)
    if not user:
        return None
    if full_name is not None:
        user.full_name = full_name
    if is_active is not None:
        user.is_active = is_active
    if role_id is not None:
        user.role_id = role_id
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user_id) -> bool:
    user = get_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
