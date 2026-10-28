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

## 📸 Screenshots

<img width="625" height="772" alt="Screenshot 2026-10-27 143518" src="https://github.com/user-attachments/assets/3cd3f1ed-f13f-4a78-87b3-eac80a7876a3" />

<img width="618" height="768" alt="Screenshot 2026-10-27 143955" src="https://github.com/user-attachments/assets/7e8bd215-bbd7-49a1-8078-c27d84a00908" />

<img width="1213" height="808" alt="Screenshot 2026-10-27 151442" src="https://github.com/user-attachments/assets/6dfc5451-da48-4cb1-8429-bee1a5bf99fe" />

<img width="1228" height="600" alt="Screenshot 2026-10-27 151537" src="https://github.com/user-attachments/assets/8288f374-bbe2-47ab-bbc4-4a480ca49162" />

<img width="807" height="867" alt="Screenshot 2026-10-27 151739" src="https://github.com/user-attachments/assets/0357a385-e9f1-4f95-9837-3655c949c0ca" />

<img width="836" height="792" alt="Screenshot 2026-10-27 151820" src="https://github.com/user-attachments/assets/99f5076c-1578-4702-ae3b-ac4421c23717" />


## 🎥 Project Demonstration

[![Google Drive Video](https://img.shields.io/badge/Google%20Drive-Watch%20Walkthrough%20Video-blue?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1_3d5t4eIn8h1T64d0gHOsiag66cfDt0W/view?usp=sharing)

* **Duration:** ~5 Minutes
* **Coverage:** System walkthrough, MongoDB Atlas relational schema, dynamic PDF receipt generation, and soft-deletion archival demo.















