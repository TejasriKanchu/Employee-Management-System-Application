
from pydantic import BaseModel
from datetime import date


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    assigned_to: int
    priority: str = "Medium"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    due_date: date | None = None
