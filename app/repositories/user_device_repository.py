# app/repositories/user_device_repository.py

from sqlalchemy.orm import Session
from models.domain_models import UserDevice

def get_by_user_and_device(db: Session, user_id, device_id: int) -> UserDevice | None:
    return db.query(UserDevice).filter(
        UserDevice.user_id == user_id,
        UserDevice.device_id == device_id
    ).first()

def create(db: Session, user_id, device_id: int) -> UserDevice:
    user_device = UserDevice(
        user_id=user_id,
        device_id=device_id
    )
    db.add(user_device)
    db.commit()
    db.refresh(user_device)
    return user_device

def update_thresholds(db: Session, user_device: UserDevice, thresholds_data: dict) -> UserDevice:
    for key, value in thresholds_data.items():
        setattr(user_device, key, value)
    db.commit()
    db.refresh(user_device)
    return user_device

def set_active_status(db: Session, user_device: UserDevice, is_active: bool) -> UserDevice:
    user_device.is_active = is_active
    db.commit()
    db.refresh(user_device)
    return user_device


def deactivate_all_for_user(db: Session, user_id) -> None:
    db.query(UserDevice).filter(
        UserDevice.user_id == user_id,
        UserDevice.is_active == True 
    ).update({"is_active": False}, synchronize_session=False)
    db.commit()

# Lấy phiên điều khiển của thiết bị trên toàn hệ thống 
def get_active_global_for_device(db: Session, device_id: int) -> UserDevice | None:
    return db.query(UserDevice).filter(
        UserDevice.device_id == device_id,
        UserDevice.is_active == True
    ).first()

from models.domain_models import UserDevice, User, Device

def get_user_threshold(db: Session, user_id: str) -> list[UserDevice]:
    results = db.query(UserDevice, User.username, Device.name.label("device_name")).join(
        User, UserDevice.user_id == User.user_id
    ).join(
        Device, UserDevice.device_id == Device.device_id
    ).filter(UserDevice.user_id == user_id).all()
    
    final_results = []
    for ud, uname, dname in results:
        ud.username = uname
        ud.device_name = dname
        final_results.append(ud)
    return final_results

def get_all_user_threshold(db: Session) -> list[UserDevice]:
    results = db.query(UserDevice, User.username, Device.name.label("device_name")).join(
        User, UserDevice.user_id == User.user_id
    ).join(
        Device, UserDevice.device_id == Device.device_id
    ).all()
    
    final_results = []
    for ud, uname, dname in results:
        ud.username = uname
        ud.device_name = dname
        final_results.append(ud)
    return final_results