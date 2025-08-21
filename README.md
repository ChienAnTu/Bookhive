# BookHive – Peer-to-Peer Book Lending Platform

BookHive is a **community-driven web platform** that allows users to share books in a secure and trustworthy way.
Users can register, list books for lending, borrow books from others, and complete transactions with accountability ensured through **deposits, reviews, and platform rules**.

---

## Features
Product Requirement Document can be found here:
https://tkzp1b.axshare.com/?g=4

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
├── frontend/         # Next.js frontend
├── backend/          # FastAPI backend (TBD)
├── docs/             # Project documentation, PRD, meeting notes, diagrams
└── README.md         # Project overview
```

---

## 📦 Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/ChienAnTu/Bookhive.git
cd Bookhive
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Runs the Next.js frontend on [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
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

## 🔒 License

This project is for academic purposes (University Capstone Project).
All rights reserved to the project contributors.

