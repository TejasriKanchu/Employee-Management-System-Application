from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import Attendance, Employee
from ..schemas.attendance import AttendanceCreate
from ..dependencies.auth import require_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/attendance")
def create_attendance(attendance : AttendanceCreate,
                      db : Session = Depends(get_db),
                      current_user : dict = Depends(require_role("admin"))):
    new_attendance = Attendance(
        employee_id = attendance.employee_id,
        date = attendance.date,
        status = attendance.status
    )
    
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    
    return new_attendance

@router.get("/attendance")
def get_attendance(db:Session = Depends(get_db),
                   current_user : dict = Depends(require_role("admin"))):
    
    return db.query(Attendance).all()

@router.get("/my-attendance")
def get_my_attendance(
    db:Session = Depends(get_db),
    current_user : dict = Depends(require_role("employee"))
):
    employee = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    
    return db.query(Attendance).filter(Attendance.employee_id == employee.id).all()

@router.get("/manager/attendance")
def get_team_attendance(
    db:Session = Depends(get_db),
    current_user : dict = Depends(require_role("manager"))  
):
    manager = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    team = db.query(Employee).filter(Employee.manager_id == manager.id).all()
    team_ids = [employee.id for employee in team]
    
    return db.query(Attendance).filter(Attendance.employee_id.in_(team_ids)).all()