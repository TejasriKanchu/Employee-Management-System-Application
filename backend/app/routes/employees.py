from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import Employee
from ..schemas.employee import EmployeeCreate, EmployeeProfileUpdate
from ..dependencies.auth import require_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/employees")
def get_employees(db:Session = Depends(get_db),
                  current_user:dict = Depends(require_role("admin"))):
    return db.query(Employee).all()

@router.get("/employees/{employee_id}")
def get_employee(employee_id:int,db:Session = Depends(get_db),
                 current_user:dict = Depends(require_role("admin"))):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    
    return employee

@router.post("/employees")
def create_employee(employee: EmployeeCreate, db:Session = Depends(get_db),
                    current_user:dict = Depends(require_role("admin"))):
    new_employee = Employee(
        user_id = employee.user_id,
        name = employee.name,
        phone = employee.phone,
        department_id = employee.department_id,
        manager_id = employee.manager_id
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return new_employee

@router.put("/employees/{employee_id}")
def update_employee(employee_id:int, employee:EmployeeCreate, db:Session = Depends(get_db),
                    current_user:dict = Depends(require_role("admin"))):
    existing_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    
    existing_employee.user_id=employee.user_id
    existing_employee.name = employee.name
    existing_employee.phone = employee.phone
    existing_employee.department_id = employee.department_id
    existing_employee.manager_id =employee.manager_id
    
    db.commit()
    db.refresh(existing_employee)
    
    return existing_employee

@router.delete("/employees/{employee_id}")
def delete_employee(employee_id:int,
                    db : Session = Depends(get_db),
                    current_user:dict=Depends(require_role("admin"))):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    
    db.delete(employee)
    db.commit()
    
    return {
        "message":"Employee deleted successfully"
    }
    
@router.get("/manager/team")
def get_my_team(db:Session = Depends(get_db),
                current_user : dict = Depends(require_role("manager"))):
    manager = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    
    employees = db.query(Employee).filter(Employee.manager_id == manager.id,
                                          Employee.id != manager.id).all()
    
    return employees

@router.get("/manager/team/{employee_id}")
def get_team_employee(employee_id : int,
                      db : Session = Depends(get_db),
                      current_user:dict = Depends(require_role("manager"))):
    manager = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
        
    employees = db.query(Employee).filter(Employee.manager_id == manager.id).all()
    
    for employee in employees:
        if employee.id == employee_id:
            return employee
        
    return None

@router.get("/my-profile")
def get_my_profile(
    db:Session = Depends(get_db),
    current_user : dict = Depends(require_role("employee"))
):
    employee = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    return employee

@router.put("/my-profile")
def update_my_profile(
    profile:EmployeeProfileUpdate,
    db:Session = Depends(get_db),
    current_user : dict = Depends(require_role("employee"))
):
    employee = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    employee.name = profile.name
    employee.phone = profile.phone
    
    db.commit()
    db.refresh(employee)
    
    return employee

@router.get("/my-manager")
def get_my_manager(
    db:Session = Depends(get_db),
    current_user : dict = Depends(require_role("employee"))
):
    employee = db.query(Employee).filter(Employee.user_id == current_user["user_id"]).first()
    manager = db.query(Employee).filter(Employee.id == employee.manager_id).first()
    
    return manager