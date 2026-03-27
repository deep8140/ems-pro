import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/modern-theme.css';

import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Attendance from './components/Attendance';
import Payroll from './components/Payroll';
import MarkAttendance from './components/MarkAttendance';
import MyProfile from './components/MyProfile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/employees" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Employees />
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Attendance />
              </ProtectedRoute>
            } />

            <Route path="/payroll" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Payroll />
              </ProtectedRoute>
            } />

            <Route path="/mark-attendance" element={
              <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
                <MarkAttendance />
              </ProtectedRoute>
            } />

            <Route path="/my-profile" element={
              <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
                <MyProfile />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
