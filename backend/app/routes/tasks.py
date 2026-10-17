
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import Task, Employee
from ..schemas.task import TaskCreate, TaskUpdate
from ..dependencies.auth import require_role

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/tasks")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    employee = db.query(Employee).filter(
        Employee.id == task.assigned_to
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("employee"))
):
    employee = db.query(Employee).filter(
        Employee.user_id == current_user["user_id"]
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return db.query(Task).filter(
        Task.assigned_to == employee.id
    ).all()


@router.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    updates = task_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}
