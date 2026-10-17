from fastapi import APIRouter,Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import Leave, Employee
from ..schemas.leave import LeaveCreate
from ..dependencies.auth import require_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.post("/leaves")
def apply_leave(
    leave:LeaveCreate,
    db:Session = Depends(get_db),
    current_user:dict = Depends(require_role("employee"))
):
    new_leave = Leave(
        employee_id = leave.employee_id,
        leave_type = leave.leave_type,
        reason = leave.reason
    )
    
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    return new_leave

@router.get("/manager/leaves")
def get_team_leaves(db:Session = Depends(get_db),
                    current_user: dict = Depends(require_role("manager"))):
    manager = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    
    team = db.query(Employee).filter(Employee.manager_id == manager.id).all()
    
    team_ids = [employee.id for employee in team]
    
    return db.query(Leave).filter(Leave.employee_id.in_(team_ids),
                                  Leave.status == "pending").all()


@router.put("/manager/leaves/{leave_id}")
def update_leave_status(leave_id:int,
                        status:str,
                        db:Session = Depends(get_db),
                        current_user:dict = Depends(require_role("manager"))):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    leave.status = status
    
    db.commit()
    db.refresh(leave)
    
    return leave

@router.get("/my-leaves")
def get_my_leaves(
    db:Session = Depends(get_db),
    current_user:dict = Depends(require_role("employee"))
):
    employee = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    
    return db.query(Leave).filter(Leave.employee_id == employee.id).all()

@router.get("/admin/leaves")
def get_all_leaves(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    return db.query(Leave).all()