from pydantic import BaseModel

class LeaveCreate(BaseModel):
    employee_id : int
    leave_type :str
    reason:str