from pydantic import BaseModel

class UserCreate(BaseModel):
    email:str
    password:str
    role:str

class LoginRequest(BaseModel):
    email: str
    password: str 
    
class ChangePassword(BaseModel):
    old_password : str
    new_password : str