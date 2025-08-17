from fastapi import FastAPI
from app.routes import user, book
from app.db import init_db, start_ssh_tunnel

# Create FastAPI app instance
app = FastAPI()

# Start the SSH tunnel for secure remote DB access
start_ssh_tunnel()

# Initialize database tables (create if not exists)
init_db()

# Default root route for homepage
@app.get("/")
def read_root():
    return {"message": "Welcome to BookHive!"}
    
app.include_router(user.router)
app.include_router(book.router)