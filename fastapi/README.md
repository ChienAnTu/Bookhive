# BookHive FastAPI Backend

This directory contains the FastAPI backend for the BookHive project, focusing on JWT-based authentication (signup/register, login, logout) with MySQL integration. It serves API endpoints for the Next.js frontend in `../capstone-project/`.

## Overview
- **Purpose**: Provides secure authentication APIs using JWT tokens, password hashing (bcrypt), and MySQL for user storage.
- **Tech Stack**: FastAPI, SQLAlchemy (ORM), PyMySQL (MySQL driver), python-jose (JWT), passlib (hashing).
- **Key Features**:
  - User registration with validation (password match, terms agreement).
  - Login with JWT token issuance.
  - Protected endpoints (e.g., /me for user info, /logout).
- **Integration**: Designed to work with the Next.js frontend—endpoints accept JSON/form data and return JWT for session management.

## Requirements
- Python 3.8+.
- MySQL server (e.g., local or remote).
- Dependencies: Listed in `requirements.txt` (install with `pip install -r requirements.txt`).

## Setup
1. **Clone the Repo** (if not already):
   ```
   git clone <repo-url>
   cd BookHive/fastapi
   ```

2. **Install Dependencies**:
   ```
   pip install -r requirements.txt
   ```

3. **Database Setup**:
   - Run the SQL script at `../vincent-tong-mysql-query-create-db.sql` to create the database and users table:
     ```
     mysql -u root -p < ../vincent-tong-mysql-query-create-db.sql
     ```
   - Ensure the table has additional fields (name, location, avatar, created_at)—add them manually if needed:
     ```sql
     ALTER TABLE users 
     ADD COLUMN name VARCHAR(100) NOT NULL,
     ADD COLUMN location VARCHAR(100),
     ADD COLUMN avatar VARCHAR(255),
     ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL;
     ```

4. **Environment Variables**:
   - Copy `../.env.example` to `../.env` (at project root) and fill in values:
     ```
     # Database (required)
     DB_USER=myuser
     DB_PASSWORD=123456
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=BookHive

     # JWT (required)
     SECRET_KEY=your-secure-random-key  # Generate with: python -c 'import secrets; print(secrets.token_hex(32))'
     ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=30

     # CORS (optional)
     ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
     ```
   - Never commit `.env`—it's in .gitignore.

## Running the Server
- Development (with auto-reload):
  ```
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```
- Production: Remove `--reload` and use a production server like Gunicorn.
- Access: http://localhost:8000 (root), http://localhost:8000/docs (Swagger UI for testing).

## API Endpoints
Focus on authentication (/api/v1/auth prefix):

- **POST /register**: Create a new user (JSON body: name, email, password, confirm_password, agree_terms). Returns user details.
- **POST /login**: Authenticate and get JWT (JSON body: email, password). Returns {access_token}.
- **POST /logout**: Logout (requires Bearer token). Returns success message (client-side clears token).
- **GET /me**: Get current user info (requires Bearer token). Returns user details.

Test in Swagger (authorize with "Bearer <token>") or Postman.

## Project Structure
- Overall:
BookHive/
├── fastapi/ # Backend API
│ ├── main.py # FastAPI application entry point
│ ├── requirements.txt # Python dependencies
│ ├── .env.example # Environment template
│ ├── core/ # Core app config
│ │ ├── init.py
│ │ ├── config.py # Application settings
│ │ ├── security.py # JWT & password utilities
│ │ └── dependencies.py # FastAPI dependencies
│ ├── models/ # Database models
│ │ ├── init.py
│ │ ├── base.py # SQLAlchemy base model
│ │ └── user.py # User model
│ ├── routes/ # API routes
│ │ ├── init.py
│ │ ├── auth.py # Authentication endpoints
│ │ └── users.py # User management endpoints
│ ├── services/ # Business logic
│ │ ├── init.py
│ │ ├── auth_service.py # Authentication services
│ │ └── user_service.py # User CRUD operations
│ ├── database/ # Database handling
│ │ ├── init.py
│ │ ├── connection.py # Database connection
│ │ └── session.py # Session management
│ ├── middleware/ # Custom middlewares
│ │ ├── init.py
│ │ ├── cors.py # CORS configuration
│ │ └── auth_middleware.py # JWT middleware
│ └── utils/ # Utility functions
│ ├── init.py
│ ├── password.py # Password utilities
│ └── validators.py # Input validation
│
├── capstone-project/ # Next.js frontend
├── .env # Shared environment variables
├── README.md # Project documentation
└── vincent-tong-mysql-query-create-db.sql # Database schema

- 3 tiers design architecture:
FrontEnd --- API ---> Business Logic ---> DB

- Design pattern:
Model - View - Controller

- **`main.py`**: App entry point, middleware setup.
- **`requirements.txt`**: Dependencies.
- **`core/`**: Config, security (JWT/password), dependencies.
- **`models/`**: SQLAlchemy DB models (e.g., User).
- **`routes/`**: API endpoints (auth.py for login/register/logout).
- **`services/`**: Business logic (e.g., auth_service.py for user creation/verification).
- **`database/`**: DB connection/session management.
- **`middleware/`**: CORS and auth middleware.
- **`utils/`**: Helpers (e.g., password utils, validators).

## Testing
- **Manual**: Use Swagger (/docs) or curl:
  ```
  # Login
  curl -X POST "http://localhost:8000/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email": "test@example.com", "password": "pass"}'

  # Protected (with token)
  curl -X GET "http://localhost:8000/api/v1/auth/me" -H "Authorization: Bearer <token>"
  ```
- **Integration**: Call from Next.js frontend (update login/register pages with fetch).

## Troubleshooting
- **DB Errors**: Check `.env` vars and MySQL connection.
- **JWT Issues**: Verify SECRET_KEY and token expiration.
- **CORS**: Ensure ALLOWED_ORIGINS includes frontend URL.
- **Logs**: Check terminal for details; add prints for debugging.
- **Common Fixes**: Restart server after changes; reinstall deps if issues persist.

For questions, contact [your name/email]. Contributions welcome via PRs to feature branches!