from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials

from ..utils.auth import verify_token

oauth2_scheme = HTTPBearer()

def get_current_user(credentials : HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    
    payload = verify_token(credentials.credentials)
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    return payload

def require_role(required_role : str):
    def role_checker(current_user:dict = Depends(get_current_user)):
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=403,
                detail = "Access denied"
            )
        return current_user
    return role_checker