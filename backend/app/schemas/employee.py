from pydantic import BaseModel

class EmployeeCreate(BaseModel):
    user_id : int 
    name:str
    phone:str
    department_id:int
    manager_id:int | None = None
    
class EmployeeProfileUpdate(BaseModel):
    name:str
    phone:str