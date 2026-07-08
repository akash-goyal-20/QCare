# QCare - Know Before You Go

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)

QCare is a modern, full-stack healthcare platform designed to streamline emergency room and outpatient department (OPD) queueing. It provides patients with real-time clinic wait times, location-based hospital recommendations (via PostGIS spatial querying), an AI-assisted symptom triage assistant, and doctor appointment scheduling.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Prerequisites](#5-prerequisites)
6. [Installation](#6-installation)
7. [Environment Variables](#7-environment-variables)
8. [Database Setup](#8-database-setup)
9. [Authentication](#9-authentication)
10. [Creating Hospital Admin Accounts](#10-creating-hospital-admin-accounts)
11. [Adding a New Hospital](#11-adding-a-new-hospital)
12. [Adding Doctors](#12-adding-doctors)
13. [Hospital Images](#13-hospital-images)
14. [Running the Project](#14-running-the-project)
15. [API Overview](#15-api-overview)
16. [Patient Features](#16-patient-features)
17. [Hospital Admin Features](#17-hospital-admin-features)
18. [Dummy Data](#18-dummy-data)
19. [Deployment](#19-deployment)
20. [Troubleshooting](#20-troubleshooting)
21. [Future Improvements](#21-future-improvements)
22. [Contributors](#22-contributors)
23. [License](#23-license)

---

## 1. Project Overview

QCare bridges the gap between patient distress and hospital resource allocation by providing a real-time tracking and dispatch dashboard. 

### Purpose
* **Skip the Wait:** Helps patients check queue lengths before stepping out.
* **Smart Routing:** Identifies nearest medical centers with specialty coverage and available bed space.
* **Pre-Diagnosis:** Utilizes an AI symptom checker to categorize urgency levels before hospital arrival.

### Main Features
* **Patient Portal:** Searchable map view of closest hospitals, booking slots, and AI triage checkups.
* **Hospital Admin Portal:** Management suite for updating wait times, doctor profiles, slot generation, bed counts, and banner assets.

---

## 2. Tech Stack

### Frontend
* **Core:** React 18, Vite (fast HMR dev build)
* **Routing & State:** React Router DOM v6, Axios interceptors for JWT routing
* **Styling:** CSS Grid/Flexbox, Tailwind CSS
* **Map Engine:** Leaflet.js & React-Leaflet
* **Icon Set:** Lucide React

### Backend
* **Server:** Express.js (Node.js framework)
* **Real-time Communication:** WebSocket (`ws` module) for live OPD wait-time broadcast
* **Database Driver:** `pg` (node-postgres)
* **Password Encryption:** `bcryptjs`

### Database
* **PostgreSQL** with **PostGIS** extension (spatial indexes and query functions)

### Session & Cache
* **Redis** (optional caching/rate-limiting layer)

---

## 3. Project Architecture

The architecture consists of a React single-page application communicating with an Express.js backend. User authentication state is handled via stateless JSON Web Tokens. PostGIS coordinates database lookups using spatial indexing to determine distances.

```mermaid
graph TD
  A[Patient/Admin Web App] <-->|REST API + JWT Header| B[Express.js API Server]
  A <-->|Live Updates via WebSockets| B
  B <-->|Query Session Data| C[(Redis Cache)]
  B <-->|GIS Spatial Lookups & Relational Queries| D[(PostgreSQL + PostGIS)]
```

* **Relational Layer:** PostgreSQL processes tables, references, and indices.
* **Spatial Layer:** PostGIS handles coordinates and executes distance sorting.
* **Live Broadcast:** WebSockets push hospital bed availability and OPD wait time updates instantly from the Admin Dashboard to active Patient Dashboards.

---

## 4. Folder Structure

```text
QCare/
├── backend/
│   ├── config/              # Db and socket connection configurations
│   ├── controllers/         # Express endpoint controllers
│   ├── db/                  # SQL schema and seed files
│   ├── middleware/          # Auth security and request verification
│   ├── routes/              # Express API route configurations
│   ├── server.js            # Express backend gateway launcher
│   └── package.json
├── frontend/
│   ├── public/              # Global static SVG/image resources
│   ├── src/
│   │   ├── api/             # Axios client configurations
│   │   ├── components/      # Reusable UI widgets (Navbar, Toast, Maps)
│   │   ├── context/         # Auth state context
│   │   ├── hooks/           # Custom hook helpers (sockets, page titles)
│   │   ├── pages/           # Page routes (Patient Dashboard, Admin Portal)
│   │   ├── App.jsx          # Route mappings
│   │   ├── index.css        # Global CSS rules
│   │   └── main.jsx         # Vite application entry point
│   ├── index.html
│   └── package.json
```

---

## 5. Prerequisites

Before setting up the repository, ensure you have the following installed:
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **PostgreSQL:** Database server running locally or cloud-hosted
* **PostGIS Extension:** MUST be installed on the PostgreSQL instance
* **Redis:** Server running locally (default port `6379`) or a cloud instance

---

## 6. Installation

Follow these steps to run a development instance of QCare:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/qcare.git
cd QCare
```

### 2. Set Up the Backend
```bash
cd backend
npm install
```
Create a `.env` file in `/backend` (refer to the [Environment Variables](#7-environment-variables) section below for variables).

### 3. Initialize the Database
```bash
# Executing seed scripts to configure schema and dummy data
npm run db:reset
```

### 4. Run the Backend
```bash
npm run dev
# The server starts on http://localhost:5001 (or configured PORT)
```

### 5. Set Up the Frontend
```bash
cd ../frontend
npm install
npm run dev
# The Vite app starts on http://localhost:5173
```

---

## 7. Environment Variables

Create a `.env` file in the `/backend` directory.

| Variable Name | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Backend listening port | `5001` |
| `DATABASE_URL`| Yes | PostgreSQL PostGIS connection string | `postgres://user:pass@localhost:5432/qcare` |
| `JWT_SECRET` | Yes | Secure string key to sign auth tokens | `super-secret-jwt-key` |
| `REDIS_URL` | No | Redis connection URI | `redis://127.0.0.1:6379` |

---

## 8. Database Setup

Ensure your PostgreSQL database has the PostGIS spatial extension enabled.

### 1. Verification of Tables
The database schema consists of six primary tables:
* `users`: Mapped accounts with role authorization types (`patient` and `hospital_admin`).
* `hospitals`: Hospital names, addresses, available beds, and geometric locations.
* `doctors`: Doctors mapped directly to their parent clinic centers.
* `slots`: Booking availability dates and times.
* `bookings`: Patient appointments with unique idempotency keys.
* `triage_results`: Saved AI diagnosis histories.

### 2. Automatic Initialization
Execute the following inside the `/backend` directory to clean, initialize, and seed the database schema:
```bash
npm run db:reset
```

---

## 9. Authentication

Authentication is handled via JSON Web Tokens (JWT) inside HTTP authorization headers.

```text
Login Request ──> Controller Verifies Password ──> Generates Signed JWT
                                                          │
Patient/Admin Portal <── Attaches Token in Auth Header <───┘
```

### Access Control Routing
Users are split into two authorization groups:
* `patient`: Can access dashboards, locator search maps, and doctor scheduling calendars.
* `hospital_admin`: Granted access to the Admin Portal (`/admin/portal`). Must have a valid `hospital_id` assigned.

---

## 10. Creating Hospital Admin Accounts

Hospital admin profiles are inserted directly into the database. Passwords MUST be encrypted using `bcryptjs` (salt rounds = 10) prior to inserting into the `password_hash` column.

### Example Admin Account Insertion
```sql
-- Step 1: Insert hospital (if not present) and get ID (e.g., ID = 1)
-- Step 2: Insert the User with 'hospital_admin' role and map hospital_id
INSERT INTO users (name, email, password_hash, role, hospital_id)
VALUES (
  'Admin Officer',
  'admin.aiims@qcare.in',
  '$2a$10$g0rX37jXF.4i5LwH.V/1o.fW07x2r5D8wKx9l9L7aH.2z6z5y5w5.', -- bcrypt hashed 'AdminPass123!'
  'hospital_admin',
  1
);
```

---

## 11. Adding a New Hospital

Hospitals are registered in the `hospitals` table. The `location` column uses the `GEOGRAPHY(POINT, 4326)` format to store latitude and longitude.

```sql
INSERT INTO hospitals (
  name, address, phone, location, specialties, wait_time_minutes, 
  available_beds, total_beds, rating, about, image_url, contact_email, 
  gallery_image_1, gallery_image_2
) VALUES (
  'Apollo Hospital',
  'Sarita Vihar, Delhi Mathura Road, New Delhi - 110076',
  '+91-11-26925858',
  ST_MakePoint(77.2912, 28.5358)::geography, -- ST_MakePoint(longitude, latitude)
  ARRAY['Cardiology', 'Emergency', 'Neurology', 'Pediatrics'],
  15,
  45,
  200,
  4.6,
  'Apollo Hospital is a premium healthcare provider in India.',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
  'info@apollo.delhi',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?w=800',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800'
);
```

---

## 12. Adding Doctors

Doctors are assigned to a hospital through the `hospital_id` foreign key.

```sql
INSERT INTO doctors (
  hospital_id, name, specialty, available, qualification, experience, consultation_fee
) VALUES (
  1,
  'Dr. Priya Sharma',
  'Cardiology',
  TRUE,
  'MD, DM - Cardiology (AIIMS)',
  12,
  800
);
```

---

## 13. Hospital Images

QCare utilizes a structured image gallery system in the hospital details page.

### Layout Dimensions & Mapping

The image gallery maintains a fixed responsive layout to prevent browser stretching or visual distortion:

```text
┌───────────────────────────────┬───────────────────────────────┐
│                               │       Gallery Image 1         │
│                               │          (top-right)          │
│                               ├───────────────────────────────┤
│       Main Image              │                               │
│      (image_url)              │       Gallery Image 2         │
│                               │        (bottom-right)         │
│                               │                               │
└───────────────────────────────┴───────────────────────────────┘
```

* **Main Image (`image_url`):** Renders in the large left container slot (`h-[320px]`). This exact same URL is used as the hospital thumbnail card on the Patient Dashboard.
* **Gallery Image 1 (`gallery_image_1`):** Renders in the top-right container slot (`h-[154px]`).
* **Gallery Image 2 (`gallery_image_2`):** Renders in the bottom-right container slot (`h-[154px]`).

### Empty & Load Failure Placeholders
When any database image field is missing, or if a URL fails to load, a localized placeholder card is displayed:
* **Main Image Fallback:** Displays a `Building2` icon.
* **Gallery Image 1 Fallback:** Displays a `Microscope` icon.
* **Gallery Image 2 Fallback:** Displays a `BedDouble` icon.

---

## 14. Running the Project

### Development Command
```bash
# Run backend (from /backend)
npm run dev

# Run frontend (from /frontend)
npm run dev
```

### Production Command
```bash
# Build frontend assets
cd frontend
npm run build

# Start backend production server
cd ../backend
NODE_ENV=production npm start
```

---

## 15. API Overview

### Authentication
* `POST /api/auth/register` - Create patient account
* `POST /api/auth/login` - Authenticate users

### Hospitals
* `GET /api/hospitals?lat=28.6&lng=77.2&radius=10` - Get nearest hospitals
* `GET /api/hospitals/:id` - Fetch hospital details
* `PUT /api/hospitals/:id` - Update hospital status (Admin only)

### Bookings
* `GET /api/bookings/my` - Fetch booking list
* `POST /api/bookings` - Schedule doctor slot
* `PUT /api/bookings/:id/status` - Complete or cancel booking (Admin only)

---

## 16. Patient Features

* **Dashboard:** Fast preview list showing the closest 4 hospitals, real-time wait times, and upcoming scheduled bookings.
* **Nearby Hospitals:** Sortable maps tracking active clinics and specialties inside a location radius.
* **AI Triage Assistant:** Urgency prediction engine analyzing patient symptoms to recommend medical actions.

---

## 17. Hospital Admin Features

* **Real-time Live Panel:** Instantly update emergency wait times and available bed vacancy counts.
* **Doctor Profiles:** Add, modify, or remove staff members and generate bulk calendar slots.
* **Hospital Settings:** Update descriptions, phone numbers, contact emails, and banner/gallery images.

---

## 18. Dummy Data

A complete mock configuration setup is provided in the repository to seed records for hospitals, admin accounts, and doctors:
* Run the initialization command `npm run db:reset` inside `/backend` to seed the database.
* **Admin Login Email:** `info.sgrh@qcare.in`
* **Admin Password:** `AdminPass123!`

---

## 19. Deployment

### Frontend Deployment
Compile client assets and host on static deployment environments (Vercel, Netlify):
```bash
npm run build
```

### Backend Deployment
Run the backend Node server on PaaS providers (Render, Heroku). Configure `DATABASE_URL` and `JWT_SECRET` variables within the provider dashboard.

---

## 20. Troubleshooting

* **PostGIS Extension Error:** If you get database connection or function errors like `ST_MakePoint does not exist`, ensure the PostGIS extension is installed (`CREATE EXTENSION postgis;`).
* **WebSocket Port Conflict:** If wait times are not updating, verify your client is listening to the correct backend WebSocket port configured via `PORT` variable.

---

## 21. Future Improvements

* **Cloudinary Upload:** Replace raw input text fields with an image drag-and-drop uploader.
* **Email & SMS Notifications:** Remind patients of upcoming appointments via automated triggers.
* **Mapbox Integration:** Upgrade Leaflet maps with custom routing indicators.

---

## 22. Contributors

* Akashtech (Placeholder) - Lead Developer

---

## 23. License

This project is licensed under the MIT License. See the [LICENSE](file:///Users/akash/Desktop/QCare/LICENSE) file for the full license text.
