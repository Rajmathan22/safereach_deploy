# SafeReach - AWS EC2 Docker Deployment Guide

This guide provides an end-to-end, step-by-step procedure to deploy the complete **SafeReach** application (Frontend, PHP Backend, MySQL 8.0 Database, phpMyAdmin, and Seed Data) on an **AWS EC2 instance** using Docker and Docker Compose.

---

## 🏗 Architecture Overview

When deployed with Docker on AWS EC2, the architecture consists of 4 containerized services connected via an internal bridge network:

```
                  ┌────────────────────────────────────────┐
                  │          AWS EC2 Instance              │
                  │                                        │
Internet ───────► │  [Port 80 / 3000] Frontend (Nginx)     │
(Browser)         │     ├── Serves React/Vite SPA          │
                  │     └── Reverse proxies /api/ & /health│
                  │               │ (internal)             │
                  │               ▼                        │
                  │  [Port 5000] Backend (PHP 8.2 Apache)  │
                  │               │                        │
                  │               ▼                        │
                  │  [Port 3306] Database (MySQL 8.0)      │
                  │               ▲ (Persistent Volume)    │
                  │               │                        │
Admin/Dev ──────► │  [Port 8085] phpMyAdmin (Web GUI)     │
                  └────────────────────────────────────────┘
```

- **Frontend (Nginx)**: Runs on port `80` (and `3000`). Automatically proxies all `/api/` traffic to the backend container. No CORS or mixed-content issues!
- **Backend (PHP 8.2 + Apache)**: Serves REST APIs on port `5000`.
- **Database (MySQL 8.0)**: Automatically initializes tables (`schema.sql`) and sample data (`seed.sql`) upon first startup into a persistent Docker volume (`safereach_mysql_data`).
- **phpMyAdmin**: Web interface on port `8085` for inspecting database tables and records.

---

## 📋 Prerequisites & AWS EC2 Sizing

### Recommended EC2 Instance Specifications:
- **AMI**: Ubuntu Server 22.04 LTS or 24.04 LTS (x86_64)
- **Instance Type**: `t2.small` or `t3.small` (2 vCPU, 2 GB RAM recommended). *`t2.micro` (1 GB RAM) can work if a 2GB swap file is added.*
- **Storage**: 20 GB – 30 GB gp3 SSD.

---

## 🚀 Step 1: Launch and Configure AWS EC2 Instance

1. Log into your **AWS Management Console** and navigate to **EC2** > **Instances** > **Launch an instance**.
2. **Name**: `SafeReach-Production` (or your preferred name).
3. **OS Image**: Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS).
4. **Instance Type**: Select `t3.small` (or `t2.small` / `t2.micro`).
5. **Key pair (login)**: Choose an existing `.pem` key pair or create a new one (e.g. `safereach-key.pem`) and download it.
6. **Network Settings / Security Group**:
   Create a Security Group with the following **Inbound Rules**:

   | Type | Protocol | Port Range | Source | Purpose |
   | :--- | :--- | :--- | :--- | :--- |
   | **SSH** | TCP | `22` | `My IP` or `0.0.0.0/0` | Remote server terminal access |
   | **HTTP** | TCP | `80` | `0.0.0.0/0` | Primary Web Application access |
   | **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure Web access (SSL/TLS) |
   | **Custom TCP** | TCP | `3000` | `0.0.0.0/0` | Alternative Frontend port |
   | **Custom TCP** | TCP | `5000` | `0.0.0.0/0` | Direct Backend API access (Optional) |
   | **Custom TCP** | TCP | `8085` | `My IP` or `0.0.0.0/0` | phpMyAdmin DB Manager (Restrict to your IP for safety) |

7. **Storage**: Set size to `20 GiB` gp3.
8. Click **Launch Instance**.
9. Once launched, note your instance's **Public IPv4 address** (e.g. `54.210.45.120`) or **Public IPv4 DNS**.

---

## 🔑 Step 2: Connect to the EC2 Instance via SSH

Open your local terminal (PowerShell, Command Prompt, or Mac/Linux Terminal) where your `.pem` key file is saved:

```bash
# On Linux / Mac: set permissions for the private key
chmod 400 safereach-key.pem

# SSH into the EC2 instance (replace with your EC2 Public IP and key path)
ssh -i "safereach-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## 🐳 Step 3: Install Docker and Docker Compose on EC2

Run the following commands on your EC2 instance terminal:

```bash
# 1. Update package lists and install basic tools
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg git

# 2. Add Docker's official GPG key and repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker Engine, CLI, and Compose plugin
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# 5. Allow ubuntu user to run Docker commands without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# 6. Verify Docker installation
docker --version
docker compose version
```

*(Optional for 1GB RAM / t2.micro instances: Create a 2GB Swap file to prevent memory exhaustion during builds)*:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📥 Step 4: Clone the SafeReach Repository

Clone your repository to the EC2 instance:

```bash
cd /home/ubuntu

# Clone repository
git clone https://github.com/Rajmathan22/safereach_deploy.git

# Enter project directory
cd safereach_deploy
```

> Private repository? Use a deploy key or a personal access token instead of the plain HTTPS URL:
> `git clone https://<username>:<token>@github.com/Rajmathan22/safereach_deploy.git`
> (do not commit that URL anywhere).

---

## ⚙️ Step 5: Configure Environment Variables

Create your `.env` file from the provided example:

```bash
cp .env.docker.example .env
```

Review or edit the `.env` file if you want to change any database credentials or secrets:

```bash
nano .env
```

*(Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit `nano`)*.

---

## 🚀 Step 6: Build and Launch SafeReach with Docker Compose

Run the following command in `/home/ubuntu/SafeReach`:

```bash
docker compose up -d --build
```

### What happens automatically:
1. **MySQL 8.0** starts, initializes `safereach_db`, and automatically executes:
   - `01_schema.sql` (creates all 28 database tables)
   - `02_seed.sql` (populates schools, users, roles, classes, teachers, parents, students, marks, safety protocols)
2. **PHP Backend** builds and starts on port `5000` after MySQL is verified healthy.
3. **Frontend (Nginx)** builds the React application and starts on port `80` & `3000`.
4. **phpMyAdmin** starts on port `8085`.

---

## 🔍 Step 7: Verify Containers & Services

Check that all 4 containers are running and healthy:

```bash
docker compose ps
```

You should see output similar to:
```
NAME                   IMAGE                  COMMAND                  SERVICE      STATUS                    PORTS
safereach_mysql        mysql:8.0              "docker-entrypoint.s…"   mysql        Up (healthy)              0.0.0.0:3306->3306/tcp
safereach_backend      safereach-backend      "docker-php-entrypoi…"   backend      Up                        0.0.0.0:5000->5000/tcp
safereach_frontend     safereach-frontend     "/docker-entrypoint.…"   frontend     Up                        0.0.0.0:80->80/tcp, 0.0.0.0:3000->80/tcp
safereach_phpmyadmin   phpmyadmin:latest      "/docker-entrypoint.…"   phpmyadmin   Up                        0.0.0.0:8085->80/tcp
```

### Check Logs:
```bash
# View backend logs
docker compose logs -f backend

# View database logs
docker compose logs -f mysql

# View frontend logs
docker compose logs -f frontend
```

### Test API Healthcheck from EC2:
```bash
curl http://localhost/health
```
Response:
```json
{"ok":true,"status":"healthy","service":"SafeReach PHP Backend","time":"..."}
```

---

## 🌐 Accessing the Deployed Application

Replace `<YOUR_EC2_PUBLIC_IP>` with your EC2 instance's Public IP address (e.g. `http://54.210.45.120`):

| Component | URL in Browser | Description |
| :--- | :--- | :--- |
| **SafeReach Web App** | `http://<YOUR_EC2_PUBLIC_IP>` or `http://<YOUR_EC2_PUBLIC_IP>:3000` | Full Web Portal with all role dashboards |
| **Direct Backend API** | `http://<YOUR_EC2_PUBLIC_IP>:5000/api/v1/bootstrap` | API master bootstrap endpoint |
| **API Healthcheck** | `http://<YOUR_EC2_PUBLIC_IP>/health` | System health check |
| **phpMyAdmin Web UI** | `http://<YOUR_EC2_PUBLIC_IP>:8085` | Database manager (User: `root`, Pass: `rootpassword`) |

---

## 🔐 Complete Demo Login Credentials

The database comes pre-seeded with full accounts across all user roles:

### 1. 👑 Main Administrator (Platform Owner)
- **Login Portal**: `http://<YOUR_EC2_PUBLIC_IP>/login/main-admin`
- **Email**: `mainadmin@demo.safereach.edu` *(or `main@safereach.local`)*
- **Password**: `MainAdmin@2025`
- **Capabilities**: Manage schools, school registration approvals/rejections, global audit logs, system-wide analytics.

### 2. 🏫 School Administrator (Principal / Admin Staff)
- **Login Portal**: `http://<YOUR_EC2_PUBLIC_IP>/login/admin`
- **Email**: `admin@demo.safereach.edu` *(or `admin@safereach.school`)*
- **Password**: `Admin@2025`
- **Capabilities**: Manage teachers, assign class incharges, manage students, configure exam components, manage timetable, trigger go-out and safety actions.

### 3. 👩‍🏫 Class Incharge Teacher (Class 4A Incharge)
- **Login Portal**: `http://<YOUR_EC2_PUBLIC_IP>/login/teacher`
- **Email**: `teacher@demo.safereach.edu` *(or `elena.roy@safereach.school`, `priya.nair@safereach.school`)*
- **Password**: `Teacher@2025`
- **Teacher Name**: Sarah Jenkins
- **Assigned Class**: Class 4 - Section A
- **Capabilities**: Daily morning/afternoon attendance, go-out attendance, enter exam marks, send parent messages, checklist protocols.

### 4. 👨‍🏫 Assistant Teacher / Incharge
- **Login Portal**: `http://<YOUR_EC2_PUBLIC_IP>/login/teacher`
- **Email**: `james.anderson@safereach.school` *(or `david.kumar@safereach.school`)*
- **Password**: `Teacher@2025`
- **Teacher Name**: James Anderson
- **Assigned Class**: Class 4 - Section A (Assistant Incharge)

### 5. 👨‍👩‍👦 Parent / Guardian
- **Login Portal**: `http://<YOUR_EC2_PUBLIC_IP>/login/parent`
- **Email**: `parent@demo.safereach.edu` *(or `parent02@safereach.school`, `parent03@safereach.school`)*
- **Password**: `Parent@2025`
- **Parent Name**: Sarah Thompson
- **Children**: Leo Thompson (Class 4A, Roll 1), Maya Thompson (Class 4A, Roll 2)
- **Capabilities**: Mark "Ready to School", Confirm "Reached Home", Submit Absence Reasons, View Timetable, View Exam Marks & Progress.

---

## 🛠 Useful Operations & Maintenance Commands

### Re-seeding / Resetting the Database
If you ever want to re-apply the schema and fresh seed data from inside the running backend container:
```bash
docker compose exec backend php database/migrate.php
```

Or hit the seed endpoint in your browser or curl:
```bash
curl -X POST http://localhost/api/v1/seed
```

### Stopping the Services
```bash
docker compose down
```

### Restarting the Services
```bash
docker compose restart
```

### Rebuilding after Code Changes
```bash
cd /home/ubuntu/safereach_deploy
git pull origin main
docker compose up -d --build
```

The `frontend` image bakes the compiled SPA in at build time, so a frontend change needs the
`--build` flag — a plain `docker compose restart` keeps serving the old bundle.

Schema, seed and migration files only execute on a **fresh** database volume. On an existing
volume, apply column changes explicitly after pulling:

```bash
docker compose exec backend php database/migrate.php
```

### Complete Reset (Wipe Database Volume and Rebuild from Scratch)
```bash
docker compose down -v
docker compose up -d --build
```

---

## 🔒 Optional: Add SSL (HTTPS) with Let's Encrypt & Custom Domain

If you attach a domain (e.g. `safereach.yourdomain.com`) pointing to your EC2 Public IP:

1. Install Certbot on EC2 host:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```
2. Or use Nginx proxy manager / reverse proxy with automatic SSL certificate renewal.

---

## 🎯 Summary Checklist

- [x] AWS EC2 instance created with Ubuntu 22.04 / 24.04
- [x] Security Group inbound rules opened for ports `22`, `80`, `443`, `3000`, `5000`, `8085`
- [x] Docker & Docker Compose installed
- [x] Repository cloned to `/home/ubuntu/SafeReach`
- [x] `.env` configured from `.env.docker.example`
- [x] `docker compose up -d --build` executed
- [x] Web portal verified at `http://<EC2_PUBLIC_IP>`
- [x] Tested logins using demo credentials for Admin, Teacher, and Parent
