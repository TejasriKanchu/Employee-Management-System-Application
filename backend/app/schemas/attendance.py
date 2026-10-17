from pydantic import BaseModel

class AttendanceCreate(BaseModel):
    employee_id : int
    date:str
    status:str
