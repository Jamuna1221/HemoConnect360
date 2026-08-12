<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success" alt="Project Status" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase" />
</div>

<h1 align="center">HemoConnect360 🩸</h1>

<h3 align="center">
  The Next-Generation Blood Donation & Blood Bank Management System
</h3>

<p align="center">
  <strong>HemoConnect360</strong> is an advanced, multi-tenant <strong>blood donation platform</strong> designed to seamlessly connect blood banks, hospitals, and emergency requesters with nearby voluntary blood donors. By leveraging real-time geospatial matching, HemoConnect360 ensures that emergency blood requests are fulfilled faster, saving lives when every second counts.
</p>

---

## 🔍 Why HemoConnect360? 

If you are looking for a comprehensive **blood donation system**, **blood bank inventory management software**, or an **emergency blood request app**, HemoConnect360 provides an open-source architecture built for scale. 

Key search features:
* **Find Blood Donors Nearby:** Uses advanced geospatial mathematics (Haversine formula via PostGIS) to match donors within a specific radius of a hospital or blood bank.
* **Blood Bank Management:** A complete multi-tenant portal for hospitals and blood banks to manage their physical blood inventory, collections, and requests.
* **Emergency Blood Requests:** Requesters can broadcast urgent needs for specific blood types (e.g., O-Negative, AB-Positive) which instantly notifies compatible donors.
* **Smart Matching Algorithm:** Donors are only matched if they meet medical eligibility (e.g., 90/120-day donation intervals) and strict blood group compatibility rules.

## ✨ Key Features

- 📍 **Geospatial Location Matching:** Calculates exact distances between hospitals and donors securely on the database level.
- 🔔 **Real-time Notifications:** Donors receive instant push alerts when a nearby patient needs their specific blood type.
- 📊 **Admin & Verification Dashboards:** Robust admin panels to verify hospitals and blood banks to prevent fraud.
- 🔒 **High Security:** Built on top of Supabase/PostgreSQL with JWT authentication and granular database permissions.

## 🛠️ Technology Stack

HemoConnect360 is built using a modern, scalable web stack:

**Frontend (Client Portal):**
- **React.js** (Vite)
- Custom CSS / Responsive Design
- Geolocation API

**Backend (API Server):**
- **Node.js & Express.js**
- Modular Monolith architecture (Domain-Driven Design)
- Custom Middlewares & JWT Auth

**Database & BaaS:**
- **PostgreSQL** (via Supabase)
- **PostGIS** / Custom SQL RPCs for spatial queries
- **Row Level Security (RLS)**

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (for PostgreSQL database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/HemoConnect360.git
   cd HemoConnect360
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file and add your Supabase / Database credentials
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   # Create a .env.local file with VITE_API_BASE_URL and Supabase keys
   npm run dev
   ```

4. **Database Migrations:**
   Ensure you run the SQL migration scripts located in `backend/database/migrations/` inside your Supabase SQL editor to set up the necessary tables, RPCs, and geospatial matching functions.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. If you have a suggestion that would make this **blood donation platform** better, please fork the repo and create a pull request. 

Let's build technology that saves lives! ❤️

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
