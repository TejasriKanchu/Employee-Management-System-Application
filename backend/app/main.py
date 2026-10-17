
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .database.connection import engine,Base
from .database import models
from .routes import employees
from .routes import departments
from .routes import users
from .routes import leaves
from .routes import attendance
from .routes import tasks


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(users.router)
app.include_router(leaves.router)
app.include_router(attendance.router)
app.include_router(tasks.router)

@app.get("/")
def home():
    return {"Message": "Employee Management System API"}