from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import User
from ..schemas.user import UserCreate, LoginRequest, ChangePassword
from ..utils.security import hash_password, verify_password
from ..utils.auth import create_access_token, verify_token
from ..dependencies.auth import require_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.post("/users")
def create_user(user:UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        email=user.email,
        password = hash_password(user.password),
        role = user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/users")
def get_user(db: Session = Depends(get_db),
             current_user: dict = Depends(require_role("admin"))):
    users =db.query(User).all()
    
    return users

@router.get("/users/{user_id}")
def get_user(user_id:int,
             db:Session = Depends(get_db),
             current_user:dict = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    return user

@router.put("/users/{user_id}")
def update_user(user_id:int, user:UserCreate,db:Session = Depends(get_db),
                current_user:dict = Depends(require_role("admin"))):
    existing_user = db.query(User).filter(User.id == user_id).first()
    
    existing_user.email = user.email
    existing_user.password = user.password
    existing_user.role = user.role
    
    db.commit()   
    db.refresh(existing_user)
    
    return existing_user

@router.delete("/users/{user_id}")
def delete_user(user_id:int,db:Session=Depends(get_db),
                current_user:dict = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    db.delete(user)
    db.commit()
    
    return {"message":"user Deleted Successfully"}

@router.post("/login")
def login(user: LoginRequest, db:Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    
    if not existing_user:
        return{
            "message":"Invalid email or password"
        }
    if not verify_password(user.password,existing_user.password):
        return{
                    "message":"Invalid email or password"
        }
        
    access_token = create_access_token({
        "user_id":existing_user.id,
        "role":existing_user.role
    })
    
    return {
        "message":"Login successful",
        "access_token":access_token,
        "token_type": "bearer"
    }
    
@router.get("/manager-test")
def manager_test(current_user:dict = Depends(require_role("manager"))):
    return{
        "message":"Manager access granted"
    }
    
@router.get("/admin/dashboards")
def admin_dashboard(current_user:dict = Depends(require_role("admin"))):
    return{
        "message":"Welcome to Admin Dashboard",
        "user_id":current_user["user_id"],
        "role":current_user["role"]
    }

@router.get("/manager/dashboards")
def manager_dashboard(current_user:dict = Depends(require_role("manager"))):
    return{
        "message":"Welcome to Manager Dashboard",
        "user_id":current_user["user_id"],
        "role":current_user["role"]
    }
    
@router.put("/change-password")
def change_password(
    password_data : ChangePassword,
    db:Session = Depends(get_db),
    current_user : dict = Depends(require_role("employee"))
):
    user = db.query(User).filter(
        User.id == current_user["user_id"]
    ).first()
    
    if not verify_password(
        password_data.old_password,
        user.password
    ):
        return {"message": " Old password is incorrect"}
    
    user.password = hash_password(password_data.new_password)
    
    db.commit()
    return {"message":"Password changed successfully"}