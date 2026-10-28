# 🛠️ Computer Repair and Service Management System (CRASMS)

A full-stack **MERN** web application engineered for hardware diagnostic laboratories and computer repair centers to streamline customer intake, real-time ticket tracking, relational technician assignments, cost calculations, and archival lifecycle management.

---

## 🚀 Key Features

* **Real-Time Workshop Metrics & Queue Analytics:**
  * Live status counters (*Devices Restored*, *Active on Bench*, *Pending Intake*, and *Total Jobs Handled*).
  * Automated workshop service efficiency / completion rate calculator.
  * Real-time color-coded workload queue progress breakdown.
* **Customer Intake & Two-Tier Validation:**
  * Interactive replacement parts catalog with one-click injection into customer intake notes.
  * Strict client-side regex protection (`/^(?:0|94|\+94)?(7[0-9]{8})$/`) paired with Mongoose server-side schema constraints.
  * Auto-generated tracking reference format (`CR-XXXXX`).
  * Instant, client-side itemized PDF receipt generation via `jsPDF` with dynamic multi-line vertical layout adjustment.
* **Public Tracking Portal:**
  * Real-time search by Tracking ID or Customer Name without login credentials.
* **Technician Administration & Diagnostics:**
  * Password-protected administrative access.
  * Live financial analytics (*Earned Revenue*, *Pending Revenue*, *Total Pipeline*).
  * Status filtering tabs with dynamic live badge counts (*All Active*, *Pending*, *Diagnosing*, *Waiting on Parts*, *Completed*).
  * In-memory sorting by receipt date or service cost without DOM reloads.
  * Dynamic pricing calculator combining catalog components with a base labor fee.
  * One-click international WhatsApp customer pickup alert integration.
* **Relational Database Design:**
  * Normalized MongoDB schema linking `Tickets` to `Technicians` using Mongoose `ObjectId` references.
* **Soft-Delete Archival & Data Integrity:**
  * Soft-deletion architecture (`isDeleted: true`) prevents accidental database purges.
  * Dedicated **🗑️ Deleted Orders** dashboard tab allowing single-click ticket restoration or permanent hard purge.
  * Guarantees that historical completion metrics and lifetime intake counts on the home landing page remain preserved when benches are cleared.

---

## 🛠️ Tech Stack

* **Frontend:** React (Hooks, React Router v6), jsPDF, CSS3 Custom Properties
* **Backend:** Node.js, Express.js, CORS, Native DNS configuration
* **Database:** MongoDB Atlas (Mongoose ODM)
* **API Architecture:** RESTful APIs with JSON payloads

---

## 📋 RESTful API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tickets` | Retrieve all repair tickets with populated technician references |
| `POST` | `/api/tickets` | Create a new repair intake ticket with server-side validation |
| `GET` | `/api/tickets/search/:query` | Search active/completed tickets by Tracking ID or Customer Name |
| `PUT` | `/api/tickets/:id` | Update ticket status, technician assignment, parts used, or costs |
| `DELETE` | `/api/tickets/:id` | Soft-delete / archive ticket (`isDeleted: true`) to preserve historical metrics |
| `PUT` | `/api/tickets/restore/:id` | Restore an archived ticket back to the active technician workbench |
| `DELETE` | `/api/tickets/permanent/:id` | Permanently purge a ticket record from MongoDB |
| `GET` | `/api/technicians` | Fetch registered engineering staff for dropdown population |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [MongoDB Atlas](https://www.mongodb.com/atlas) account or local MongoDB instance

### 2. Backend Setup
```bash
cd backend
npm install
node server.js
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

## 👨‍💻 Author
* **Sadun Angelo** — Department of Electrical and Information Engineering, Faculty of Engineering, University of Ruhuna.
