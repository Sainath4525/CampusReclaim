# CampusReclaim — lost & found platform for college campuses

CampusReclaim is separated into a dedicated Frontend client and Backend API server.

---

## 📁 Project Structure

```text
campusreclaim/ (Workspace Root)
├── backend/                  # Express REST API Server
│   ├── controllers/
│   │   └── itemController.js # Handles Item CRUD, search, status, and email logic
│   ├── middleware/
│   │   ├── rateLimiter.js    # Prevents api spamming
│   │   └── upload.js         # Multer configuration for file uploads
│   ├── models/
│   │   └── Item.js           # Mongoose Database Schema
│   ├── routes/
│   │   └── items.js          # API router endpoints
│   ├── uploads/              # Uploaded item images
│   ├── .env                  # Port, MongoDB URI, SMTP configurations
│   ├── .env.example          # Template environment configurations
│   ├── package.json          # Node dependencies (Express, mongoose, etc.)
│   └── server.js             # API bootstrap file
├── frontend/                 # Client UI (Vite dev server)
│   ├── scripts/
│   │   ├── app.js            # Particle backdrop canvas, grid render, filter triggers
│   │   └── report-form.js    # Multi-step wizard, map-pin selector, success triggers
│   ├── styles/
│   │   └── main.css          # Glassmorphic responsive styling, light/dark themes
│   ├── index.html            # Main Single-Page HTML entry
│   └── package.json          # Frontend build configurations (Vite)
└── README.md                 # Setup & API guide
```

---

## 🛠️ Setup & Running Instructions

Ensure you have **Node.js** (includes npm) and **MongoDB** (local database or cloud Atlas URI) ready.

### 1. Backend Server Setup
Open a terminal, navigate to the `backend/` directory, and follow these steps:
```bash
# Navigate to backend folder
cd backend

# Install backend dependencies
npm install

# Setup env settings (copy example, then configure MONGO_URI)
cp .env.example .env

# Run the API server in development mode (starts on port 3000)
npm run dev
```

### 2. Frontend Client Setup
Open a separate terminal, navigate to the `frontend/` directory, and follow these steps:
```bash
# Navigate to frontend folder
cd frontend

# Install dev server dependencies (Vite)
npm install

# Start the frontend dev server (typically starts on port 5173)
npm run dev
```

Once both are running:
*   Open **`http://localhost:5173`** in your browser to interact with the frontend website.
*   The frontend will automatically query the backend APIs running on **`http://localhost:3000`**.

---

## 🔌 API Endpoints Documentation

| Method | Endpoint | Description | Payload Example / Query Parameters |
|:---|:---|:---|:---|
| **GET** | `http://localhost:3000/api/items` | Fetch reported items | Query params: `search`, `category`, `location`, `dateFrom`, `dateTo`, `sortBy`, `page`, `limit` |
| **GET** | `http://localhost:3000/api/items/:id` | Get details (increments views) | — |
| **POST** | `http://localhost:3000/api/items` | Report a new item | Multipart Form-Data (keys: `title`, `category`, `description`, `location`, `dateLost`, `status`, `image`, `reporterName`, `reporterStudentId`, `reporterEmail`, `reporterPhone`, `reporterPreferContact`) |
| **PATCH** | `http://localhost:3000/api/items/:id/status` | Update item status | JSON: `{ "status": "claimed" }` |
| **POST** | `http://localhost:3000/api/items/:id/found` | Submit "I found this" | JSON: `{ "finderName": "Jack", "finderEmail": "jack@campus.edu", "finderPhone": "1234", "finderMessage": "Found near the entrance" }` |
| **DELETE** | `http://localhost:3000/api/items/:id` | Remove a reported post | JSON: `{ "email": "reporter@campus.edu", "studentId": "CS12" }` (Verifies reporter ownership) |
