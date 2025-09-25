# BookBorrow – Peer-to-Peer Book Lending Platform

BookBorrow is a **community-driven web platform** that allows users to share books in a secure and trustworthy way.
Users can register, list books for lending, borrow books from others, and complete transactions with accountability ensured through **deposits, reviews, and platform rules**.

---

## Features
Product Requirement Document can be found here:
https://skfusc.axshare.com/?g=4

### 👤 User Management

* User registration and login
* Profile management (bio, location, ratings, history)
* Blacklist and reporting system for misuse

### 📖 Book Lending & Borrowing

* Add, edit, delete, and search books by title, author, genre, location
* Borrow request and approval workflow
* Shipping options: self-pickup or delivery
* Security deposit mechanism (hold, refund, compensation)

### 💳 Payment Gateway

* Secure deposit handling via Stripe (or equivalent)
* Service fee deduction for purchases and deposit loss
* Refunds and transparent payment status updates
* Donation support

### 💬 Messaging & Notifications

* In-app messaging linked to transactions
* Email notifications for updates, reminders, disputes
* Moderation and reporting tools

### 📊 Platform Management

* Configurable service fee rate
* Audit trail for payments and transactions
* Admin tools for blacklist, dispute handling, and fee management

---

## Tech Stack

**Frontend**

* [Next.js](https://nextjs.org/) (React framework)
* TypeScript
* TailwindCSS / Shadcn UI

**Backend**

* [FastAPI](https://fastapi.tiangolo.com/)
* SQLModel (ORM)
* MySQL (Database)

**Other Tools**

* GitHub for version control
* Axure RP for PRD & prototype design
* Stripe (payment integration)

---

## Project Timeline

Key milestones include:

* ✅ Project Ready – Requirements, PRD, and tech stack finalized
* 🔄 Core Authentication Ready – Registration & login
* 📖 Book & Loan Workflow MVP – Borrow-return cycle functional
* 💳 Payment Gateway Integrated – Deposits & transactions live
* 🚢 Final Delivery – Stable platform, documentation, and demo

*(see [Gantt Chart](docs/gantt.png) for detailed timeline)*

---

## 📂 Repository Structure

```
Bookhive/
├── frontendNext/         # Next.js frontend
├── fastapi/          # FastAPI backend (TBD)
├── docs/             # Project documentation, PRD, meeting notes, diagrams
└── README.md         # Project overview
```

---

## 📦 Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/ChienAnTu/Bookhive.git
cd Bookhive
cp .env.example .env
```
Then update detail in .env file

### 2. Frontend Setup

```bash
cd frontendNext
npm install
npm run dev
```

Runs the Next.js frontend on [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup (FastAPI)

Open a new terminal window, navigate to the frontend directory, and start the frontend:

```bash
cd fastapi
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Runs backend API at [http://localhost:8000](http://localhost:8000)

---

## 📖 Documentation & Resources

* 📑 [Draft Requirements](docs/requirements.md)
* 🖥️ [Axure Prototype](https://chienantu.github.io/Bookhive/prototype/)
* 📝 Meeting Notes (in `/docs`)

---

## 👥 Team & Roles

* Product Manager – Requirement gathering, PRD, client communications
* Frontend Developers – Next.js implementation
* Backend Developers – FastAPI, DB, API integration
* Documentation & QA – SRS, UML, testing support

---

# 📚 Bookhive Deployment Guide

## 🚀 How to Start

### Production (VPS)
```bash
make up
```
- Deploys using `compose.yaml` + `compose.prod.yaml`
- Runs with HTTPS (TLS via Certbot) and security block rules enabled
- Accessible at: `https://bookborrow.org`

### Development (Local)
```bash
make up-dev
```
- Deploys using `compose.yaml` + `compose.dev.yaml`
- No TLS, no block rules (simplified for local testing)
- Accessible at: `http://localhost`

---

## 🛠 Prerequisites

- **Docker & Docker Compose** (required in all environments)  
- **make** (for simplified commands)

### Installing `make`

#### macOS
```bash
brew install make
```
(macOS may already include `make`; check with `make --version`.)

#### Windows
1. Install [Chocolatey](https://chocolatey.org/install)  
   - Open PowerShell as Administrator  
   - Run:  
     ```powershell
     Set-ExecutionPolicy Bypass -Scope Process -Force; `
     [System.Net.ServicePointManager]::SecurityProtocol = `
     [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
     iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
     ```

2. Install make:  
   ```powershell
   choco install make
   ```

3. Restart the terminal and confirm:  
   ```powershell
   make --version
   ```

---

## 📝 Notes
- The `.env` file is **not committed** – each environment must create and maintain its own.
- Certificates (`nginx/letsencrypt/`) and logs are **VPS-only** and must never be pushed to GitHub.
- Development does not require HTTPS (use `http://localhost`).
- ⚠️ **PLEASE DO NOT PUSH ANY CODES FROM THE PRODUCTION SERVER**  
  Production is managed **only via GitHub Actions**.  
  Manual edits or commits made directly on the VPS will break deployment consistency.

---

## 🔧 Useful Commands

### Production
```bash
make up        # start containers in production mode
make down      # stop containers
make build     # rebuild containers
make logs      # follow logs (nginx, frontend, backend)
```

### Development
```bash
make up-dev    # start containers in development mode
make down-dev  # stop containers
make build-dev # rebuild containers
make logs-dev  # follow logs (nginx, frontend, backend)
```

### Clean-up
```bash
make clean     # prune unused Docker images, networks, volumes
```

## 🔒 License

This project is for academic purposes (University Capstone Project).
All rights reserved to the project contributors.

