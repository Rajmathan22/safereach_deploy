# SafeReach PHP + MySQL Backend

Production-ready PHP 8 REST API for SafeReach, connected to a unified MySQL relational database.

---

## Architecture Overview

- **Language**: PHP 8.2+ (Pure Object-Oriented, PSR-compliant)
- **Database**: MySQL 8.0 / MariaDB (`safereach_db`)
- **Web Server**: Apache with `mod_rewrite` or Nginx + PHP-FPM
- **Authentication**: JWT (JSON Web Tokens) with Scrypt/Bcrypt hashing
- **Port**: `5000`

---

## Quick Start

### 1. Database Setup

Create the MySQL database and import the schema and seeds:

```powershell
# In MySQL shell or phpMyAdmin:
CREATE DATABASE safereach_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Or run the PHP migration script:
php backend/database/migrate.php
```

### 2. Local Run (Built-in PHP Server)

To quickly run the backend locally without Apache:

```powershell
cd backend
php -S 0.0.0.0:5000 -t public
```

> **Backend URL**: [http://localhost:5000](http://localhost:5000)  
> **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## Running with Docker Compose

To launch MySQL 8.0, PHP Backend, and React Frontend in a single command:

```powershell
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **phpMyAdmin**: [http://localhost:8085](http://localhost:8085)
- **MySQL**: `localhost:3306`

---

## Endpoints Reference

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `GET` | `/api/v1/bootstrap` | Master school dataset (classes, teachers, students, reports) |
| `POST` | `/api/v1/auth/login` | User login (returns JWT token & role) |
| `GET/PATCH` | `/api/v1/school-settings` | Get / update school profile & operational hours |
| `POST` | `/api/v1/student-travel/:id/ready-to-school` | Parent starts school trip tracking |
| `POST` | `/api/v1/student-travel/:id/reached-home` | Parent confirms safe return home |
| `POST` | `/api/v1/student-travel/:id/attendance` | Teacher records morning attendance |
| `POST` | `/api/v1/student-travel/go-out` | Batch mark students departing school |
| `PATCH` | `/api/v1/students/:id/sms-enabled` | Toggle automated parent SMS alerts |
| `GET/POST` | `/api/v1/messages` | Parent-teacher message history & chat |
| `POST` | `/api/v1/messages/absence-reason` | Parent submits absence explanation |
| `POST` | `/api/v1/attendance/absence-notifications` | Trigger absence alerts to parents |
| `GET/POST` | `/api/v1/academic-results/...` | Configure exams and submit marks |
| `GET/POST/PATCH/DELETE` | `/api/v1/safety-protocols` | Daily safety checklist items |
| `GET/PUT` | `/api/v1/industry-menu-access` | School feature permissions |
| `GET` | `/api/v1/integrations/status` | System diagnostics & status |
