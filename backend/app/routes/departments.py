from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import Department
from ..schemas.department import DepartmentCreate
from ..dependencies.auth import require_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.post("/departments")
def create_department(department:DepartmentCreate,
                      db : Session = Depends(get_db),
                      current_user:dict = Depends(require_role("admin"))):
    new_department = Department(
        name = department.name,
        description = department.description
    )
       
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return new_department 

@router.get("/departments")
def get_department(db:Session = Depends(get_db),current_user:dict = Depends(require_role("admin"))):
    departments = db.query(Department).all()
    return departments

@router.get("/departments/{department_id}")
def get_department(department_id:int,db:Session=Depends(get_db),
                   current_user:dict=Depends(require_role("admin"))):
    department = db.query(Department).filter(Department.id == department_id).first()
    return department

@router.put("/departments/{department_id}")
def update_department(department_id:int, department : DepartmentCreate,
                      db:Session = Depends(get_db),
                      current_user:dict = Depends(require_role("admin"))):
    existing_department = db.query(Department).filter(Department.id == department_id).first()
    
    existing_department.name = department.name
    existing_department.description = department.description
    
    db.commit()
    db.refresh(existing_department)
    
    return existing_department

@router.delete("/departments/{department_id}")
def delete_department(department_id : int, db:Session = Depends(get_db),
                      current_user:dict = Depends(require_role("admin"))):
    department = db.query(Department).filter(Department.id == department_id).first()
    
    db.delete(department)
    db.commit()
    
    return {
        "message":"Department deleted successfully"
    }  