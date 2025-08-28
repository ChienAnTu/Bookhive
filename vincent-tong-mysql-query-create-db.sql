-- Drop the user if it exists
DROP USER IF EXISTS 'myuser'@'%';

-- Drop the database if it exists
DROP DATABASE IF EXISTS BookHive;

-- Create the database
CREATE DATABASE IF NOT EXISTS BookHive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create remote user
CREATE USER 'myuser'@'%' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON BookHive.* TO 'myuser'@'%';
FLUSH PRIVILEGES;

-- Use the BookHive database
USE BookHive;

-- Create the users table based on register/login forms and User type
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(25) PRIMARY KEY NOT NULL,                -- Unique user ID (e.g., UUID)
    name VARCHAR(100) NOT NULL,                              -- From register form "Full Name"
    email VARCHAR(50) NOT NULL UNIQUE,                       -- From register/login forms (unique)
    password_hash TEXT NOT NULL,                             -- Hashed password (e.g., bcrypt)
    password_algo ENUM('argon2id', 'bcrypt', 'scrypt') NOT NULL DEFAULT 'bcrypt',  -- Hashing algorithm
    password_set_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- When password was set
    location VARCHAR(100) DEFAULT NULL,                      -- From User type (optional)
    avatar VARCHAR(255) DEFAULT NULL,                        -- From User type (e.g., image URL, optional)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- From User type
    remember_token VARCHAR(255) DEFAULT NULL,                -- For "Remember me" in login (can store long-lived JWT refresh token)
    last_login_at DATETIME DEFAULT NULL,                     -- Track last successful login
    terms_accepted TINYINT NOT NULL DEFAULT 0                -- From register form terms agreement (fixed: no display width)
);

-- Add indexes for performance
CREATE INDEX idx_email ON users (email);
CREATE INDEX idx_created_at ON users (created_at);

-- Example: Insert a test user (for development/testing)
-- NOTE: In production, insert via FastAPI with proper password hashing
INSERT INTO users (user_id, name, email, password_hash, password_algo, password_set_at, location, avatar, created_at, terms_accepted)
VALUES 
    ('user-uuid-1234', 'Test User', 'test@example.com', '$2b$12$examplehashedpassword', 'bcrypt', CURRENT_TIMESTAMP, 'Sample Location', NULL, CURRENT_TIMESTAMP, 1);
    