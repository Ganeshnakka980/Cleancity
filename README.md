# CleanCity — Smart Waste Management & Civic Complaint Platform

> **Tagline**: *"Report. Track. Clean."*

CleanCity is a full-stack, production-grade civic-tech platform connecting citizens, municipal staff, and administrators for smart waste management, complaint tracking, geospatial hotspot analysis, real-time updates, and civic rewards.

---

## 🌟 Key Features & User Roles

### 1. Citizen Role
- **Auth & Profile**: Register, login, manage profile, track earned EcoPoints & level tiers (Bronze, Silver, Gold, Eco Champion).
- **Smart Waste Reporting**: Upload waste photo (JPG, PNG, WEBP), select category, provide description, auto-detect GPS location, or pick location manually on interactive Leaflet map.
- **Duplicate Complaint Detection**: Server-side proximity check within ~150 meters for active complaints in the same category.
- **Real Status History Timeline**: Dynamic visualization of complaint lifecycle (`Reported` → `Assigned` → `In Progress` → `Resolved` → `Verified`) with timestamps, actor information, and notes.
- **Nearby Complaints**: Explore active waste issues within 1km, 5km, and 10km radii via geospatial queries.
- **Satisfaction Feedback**: Submit 1–5 star ratings and comments on resolved complaints (awards +5 EcoPoints).

### 2. Municipal Staff Role
- **Field Dashboard**: Overview of assigned workload, pending task acceptance, and resolution rate.
- **Task Management**: Accept complaint assignments and mark status as `in_progress`.
- **Proof of Cleaning**: Upload resolution proof photo (after cleanup) and add resolution notes to mark complaint as `resolved`.

### 3. Administrator Role
- **Control Center**: Overview of all civic complaints, live interactive map, and system statistics.
- **Staff Assignment & Priority**: Assign complaints to municipal staff and adjust priority (`low`, `medium`, `high`, `critical`).
- **User & Staff Directory**: Manage citizens, toggle account status (enable/disable), and create new municipal staff accounts.
- **Geospatial Hotspot Intelligence**: Server-side MongoDB aggregation pipeline grouping high-density complaint clusters (500m radius).
- **Chart.js Analytics**: Interactive charts for complaint status distribution, category breakdown, monthly trends, and staff performance leaderboards.
- **System Audit Trail**: Complete log of administrative actions, status transitions, and user account updates.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Leaflet.js (OpenStreetMap), Chart.js |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Database** | MongoDB Atlas, Mongoose (with `2dsphere` geospatial indexing) |
| **Authentication** | JWT (JSON Web Tokens), `bcryptjs` password hashing |
| **Uploads & Utilities** | Multer, Helmet, CORS, `express-rate-limit`, Morgan, Dotenv |

---

## 📂 Project Structure

```
cleancity/
├── frontend/
│   ├── index.html                 # Public landing page with live map preview
│   ├── login.html                 # Login page with demo autofill buttons
│   ├── register.html              # Citizen registration page
│   ├── citizen/
│   │   ├── dashboard.html         # Citizen dashboard & summary
│   │   ├── report.html            # Waste report form + GPS + Leaflet picker
│   │   ├── complaints.html        # Complaints registry with filters
│   │   ├── complaint-details.html # Dynamic tracking timeline & feedback
│   │   ├── map.html               # Live interactive map & nearby filter
│   │   └── profile.html           # Profile & EcoPoints history
│   ├── staff/
│   │   ├── dashboard.html         # Staff workload dashboard & task cards
│   │   ├── complaints.html        # Staff assigned complaints view
│   │   └── complaint-details.html # Task resolution & proof photo upload
│   ├── admin/
│   │   ├── dashboard.html         # Control center & live map
│   │   ├── complaints.html        # Complaint assignment & priority modals
│   │   ├── users.html             # Citizens directory & status toggle
│   │   ├── staff.html             # Staff directory & registration modal
│   │   ├── analytics.html         # Chart.js analytics & hotspots map
│   │   └── settings.html          # System audit logs
│   ├── components/
│   │   ├── navbar.js              # Dynamic role-aware navigation header
│   │   ├── sidebar.js             # Dashboard sidebar navigation
│   │   ├── modal.js               # Reusable modal utility
│   │   ├── notification.js        # Toast notification system
│   │   └── loader.js              # Spinner and empty state helpers
│   ├── css/
│   │   └── custom.css             # Custom styles, badges, & map tweaks
│   └── js/
│       ├── api.js                 # Centralized Fetch API client
│       ├── auth.js                # Auth helper & Socket.IO client
│       ├── map.js                 # Leaflet map helper & custom pins
│       ├── report.js              # Report form handler & geolocation
│       ├── complaints.js          # Complaints list rendering & filters
│       ├── dashboard.js           # Citizen dashboard logic
│       ├── staff.js               # Staff workflow logic
│       └── admin.js               # Admin management & Chart.js renderer
├── backend/
│   ├── server.js                  # Main Express + Socket.IO entry point
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas Mongoose connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Complaint.js
│   │   ├── Notification.js
│   │   ├── Feedback.js
│   │   ├── Reward.js
│   │   └── AuditLog.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── userController.js
│   │   ├── staffController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── services/
│   │   ├── geocodingService.js
│   │   ├── notificationService.js
│   │   ├── hotspotService.js
│   │   ├── rewardService.js
│   │   ├── complaintService.js
│   │   └── uploadService.js
│   ├── utils/
│   │   ├── generateComplaintId.js
│   │   ├── validators.js
│   │   └── statusTransitions.js
│   ├── uploads/                   # Multer uploaded images folder
│   └── seed/
│       └── seed.js                # Database seeding script for Atlas
├── .env                           # Environment configuration
├── .env.example                   # Environment configuration example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Environment Variables & Setup

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/CleanCity?retryWrites=true&w=majority
JWT_SECRET=cleancity_super_secret_jwt_key_2026_production_hardening
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5000
GEOCODING_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=CleanCityApp/1.0
```

> **Note**: MongoDB is hosted directly on **MongoDB Atlas** (no local MongoDB installation required).

---

## ⚡ Quick Start & Seed Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (MongoDB Atlas)
Populates MongoDB Atlas with 25+ realistic Mumbai/Thane complaints, status histories, demo users, notifications, rewards, and feedback:
```bash
npm run seed
```

### 3. Run Server
- **Development Mode**:
  ```bash
  npm run dev
  ```
- **Production Start Mode**:
  ```bash
  npm start
  ```

Open your browser at `http://localhost:5000`.

---

## 🔐 Demo Credentials

When testing or demonstrating the application, use these pre-configured accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@cleancity.com` | `Admin@123` | Control center, assign staff, priority, analytics, audit logs |
| **STAFF** | `staff@cleancity.com` | `Staff@123` | View assigned tasks, accept work, upload resolution proof photo |
| **CITIZEN** | `citizen@cleancity.com` | `Citizen@123` | Report waste with GPS, track timeline, rate resolution, EcoPoints |

---

## 🔄 Allowed Complaint Status Transitions Matrix

State transitions are strictly enforced on the backend via `backend/utils/statusTransitions.js`:

```
[ pending ] ───► [ assigned ] ───► [ in_progress ] ───► [ resolved ] ───► [ verified ]
     │                │                                      │
     └──► [rejected] ◄┴──────────────────────────────────────┘
```

- `pending` → `assigned`, `rejected`
- `assigned` → `in_progress`, `rejected`
- `in_progress` → `resolved`
- `resolved` → `verified`, `rejected`

Any attempt to make an invalid transition (e.g. `pending` → `verified`) returns an HTTP 400 validation error.

---

## 🌐 Geospatial Architecture & GeoJSON

Locations are stored in compliance with standard **GeoJSON Point** specification:
```json
{
  "type": "Point",
  "coordinates": [72.8777, 19.0760]  // [longitude, latitude]
}
```
A `2dsphere` index is created on `Complaint.location`. Nearby search uses MongoDB `$nearSphere` geospatial operator with distance in meters.

---

## 📡 Socket.IO Real-Time Events

Authenticated Socket.IO sessions join specific channels:
- `user:<userId>` — Personal notifications & status updates
- `role:admin` — Global complaint filings & system events
- `role:staff` — Targeted task assignments

---

## 📜 License & Project Credits

Developed as a Final Year BCA Capstone Project by **Antigravity**. Licensed under the MIT License.
