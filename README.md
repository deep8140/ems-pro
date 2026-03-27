# EMS Pro - Employee Management System

EMS Pro is an advanced Employee Management System project designed to help businesses manage employee records, attendance, and payroll efficiently. It is a full-stack web application built using a modern React frontend and a robust Node.js backend.

## 🚀 Key Features

### Role-Based Access Control (RBAC)
The application provides distinct views and access levels based on user roles:
- **Admin**: Full access to all modules, including Dashboard, Employee Management, Overall Attendance, and Payroll generation.
- **Manager**: Access to Dashboard, Employee Management, and Overall Attendance modules.
- **Employee**: Can view their own profile, mark their daily attendance, and view personal metrics.

### Core Modules
- **Dashboard**: High-level overview of company metrics, total employees, attendance analytics, and dynamic charts (powered by Chart.js).
- **Employee Management**: View, add, edit, and delete employee records securely. Handles profile pictures and personal information.
- **Attendance Tracking**: 
  - Admins & Managers can view and track company-wide attendance.
  - Employees can mark their attendance daily via the dedicated "Mark Attendance" portal.
- **Payroll Management**: Admins can calculate, view, and manage salary details, deductions, and issue payrolls.
- **My Profile**: Employees can manage their personal information and securely change account settings.

## 🛠️ Tech Stack
- **Frontend**: React.js, React Router DOM, Chart.js (Data Visualization), Axios (API calls), AOS (Animate On Scroll for UI transitions).
- **Backend**: Node.js, Express.js.
- **Database Support**: Firebase (Admin SDK / Firestore) with fallback options for MySQL2.
- **Authentication**: Custom JWT (JSON Web Tokens) generated after verifying users through Firebase/DB. Password hashing via Bcrypt.
- **File Handling**: Multer for handling employee profile picture uploads.

## 📂 Project Structure
```text
EMS Pro/
├── run-project.bat                 # 1-click execution script script for the entire app
├── 6 SEM PROJECT/
│   ├── package.json                # Project root configuration
│   ├── backed/                     # Node.js backend source code
│   │   ├── firebase-server.js      # Main Firebase backend entry
│   │   ├── authMiddleware.js       # JWT Authorization middleware
│   │   ├── serviceAccountKey.json  # Firebase Admin SDK Credentials (Required)
│   │   └── uploads/                # Local storage for profile images
│   └── ems-pro-react/              # React JS frontend application
│       ├── src/components/         # Reusable React components & pages
│       ├── src/context/            # Context API (AuthContext)
│       └── package.json            # Frontend dependencies
```

## ⚙️ Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (Version 16+ recommended)
- A Firebase Project (with a downloaded `serviceAccountKey.json`)

### Installation
1. Clone the repository or extract the project files to your desired location.
2. **Install Backend Dependencies**:
   ```bash
   cd "6 SEM PROJECT"
   npm install
   ```
3. **Install Frontend Dependencies**:
   ```bash
   cd "6 SEM PROJECT/ems-pro-react"
   npm install
   ```
4. **Firebase Configuration**: 
   Ensure that a valid `serviceAccountKey.json` is placed inside the `6 SEM PROJECT/backed/` directory to allow the Node.js server to connect to your Firebase database securely.

### 🏃‍♂️ Running the Project

#### The Easy Way (Windows)
The easiest way to start both the backend server and the React frontend sequentially is to use the provided batch script:
1. Double-click the `run-project.bat` file in the main project folder.
2. It will open two command prompt windows:
   - One running the backend server on Firebase mode.
   - One firing up the React development server.
3. The application will automatically open in your default browser at `http://localhost:3000`.

#### Manual Startup
If you prefer not to use the batch file or are on macOS/Linux:

**1. Start the Backend Server (Firebase Mode)**:
```bash
cd "6 SEM PROJECT"
npm run firebase
```
*(Available alternative scripts: `npm run mysql`, `npm run dev`)*

**2. Start the Frontend App**:
```bash
cd "6 SEM PROJECT/ems-pro-react"
npm start
```

## 🛡️ Available NPM Scripts
Inside the `6 SEM PROJECT` folder, several useful utility scripts are available:
- `npm run firebase`: Starts the backend using Firebase.
- `npm run mysql`: Starts the backend using MySQL.
- `npm run verify`: Runs `verify-firebase.js` to ensure your Firebase connection is working.
- `npm run check`: Runs a general health check on the backend systems.
- `npm run fix-passwords`: Utility to hash legacy plain-text passwords in the DB.

## 📜 License
This project is licensed under the ISC License.
