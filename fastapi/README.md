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
   
   In the command line, use AWS RDS.
   
   ```bash
   mysql -h capstone15db.c7u8yy6k6lxl.ap-southeast-2.rds.amazonaws.com -P 3306 -u admin -p
   ```
   
   ![image-20250830173045147](../docs/doc-pics/image-20250830173045147.png)
   
   ```
   show databases;  
   use BookHive;
   ```
   
   Now, we can run query script in mysql command line.
   
   ![image-20250830173349811](../docs/doc-pics/image-20250830173349811.png)
   
4. **Environment Variables**:
   
   - Copy `../.env.example` to `../.env` (at project root) and fill in values:
     ```
     # Database (required)
     DB_USER=admin
     DB_PASSWORD=12345678
     DB_HOST=capstone15db.c7u8yy6k6lxl.ap-southeast-2.rds.amazonaws.com
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

## API REFERENCE

authentication:

- **POST /register**
    Endpoint: http://localhost:8000/api/v1/auth/register
    Description: This endpoint allows a new user to register. A JSON body must be provided with name, email, password, confirm_password, and agree_terms. The 
                 server will validate the input and, if valid, create a new account.
    Example Request:
    {
        "name": "Alice",
        "email": "alice@example.com",
        "password": "securePassword123",
        "confirm_password": "securePassword123",
        "agree_terms": true
    }
    Example Response:
    {
        "id": "uuid123",
        "name": "Alice",
        "email": "alice@example.com",
        "location": null,
        "avatar": null,
        "createdAt": "2025-08-24T15:00:00Z"
    }

- **POST /login**: 
    Endpoint: http://localhost:8000/api/v1/auth/login
    Description: This endpoint authenticates a user with their e-mail and password. If the credentials are correct, the server issues a JWT access token that 
                 must be used in the Authorisation: Bearer <token> header for protected routes.
    Example Request:
    {
        "email": "alice@example.com",
        "password": "securePassword123"
    }
    Example Response:
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer"
    }

- **POST /logout**: 
    Endpoint: http://localhost:8000/api/v1/auth/logout
    Description: This endpoint logs a user out. It requires a valid JWT in the Authorisation: Bearer <token> header. The server responds with a 
    confirmation message; the client is responsible for discarding the token.
    Example Request:
       None
    Example Response:
    {
        "message": "Successfully logged out"
    }

- **GET /me**: 
    Endpoint: http://localhost:8000/api/v1/auth/me
    Description: This endpoint retrieves information about the currently authenticated user. A valid JWT must be included in the Authorisation: Bearer 
                 <token> header.
    Example Request:
       None
    Example Response:
    {
        "id": "uuid123",
        "name": "Alice",
        "email": "alice@example.com",
        "location": "London",
        "avatar": "https://example.com/avatar.png",
        "createdAt": "2025-08-24T15:00:00Z"
    }          

email service:

- **POST /send_verification**:
Endpoint: http://localhost:8000/api/v1/email/send_verification
Description: This endpoint sends a verification email with an OTP code to the specified address. The server temporarily stores the OTP for validation.
Example Request:
{
    "emailAddress": "user@example.com"
}
Example Response:
{
    "message": "Verification email sent successfully."
}


- **POST /verify_otp**:
  Endpoint: http://localhost:8000/api/v1/email/verify_otp
Description: This endpoint verifies the OTP that was previously sent to the user’s email. If the OTP is valid, it is removed from the server.
Example Request:
{
    "emailAddress": "user@example.com",
    "otp": "123456"
}
Example Response (success):
{
    "message": "OTP verified successfully"
}
Example Response (failure):
{
    "detail": "Incorrect OTP"

}

- **POST /send_receipt**:
Endpoint: http://localhost:8000/api/v1/email/send_receipt
Description: This endpoint sends a receipt email containing order details and payment amount to the specified user.
Example Request:
{
    "email": "user@example.com",
    "username": "Alice",
    "total_amount": 120.50,
    "order_id": "ORD-2025-123"
}
Example Response:
{
    "message": "Receipt email sent successfully."

- **POST /send_shipment_confirmation**:
Endpoint: http://localhost:8000/api/v1/email/send_shipment_confirmation
Description: This endpoint sends a shipment confirmation email including tracking number, carrier, and estimated delivery date.
Example Request:
{
    "email": "user@example.com",
    "username": "Alice",
    "order_id": "ORD-2025-123",
    "tracking_number": "TRACK123456",
    "courier_name": "DHL",
    "estimated_delivery_date": "24/09/2025"
}
Example Response:
{
    "message": "Shipment confirmation email sent successfully."
}


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
