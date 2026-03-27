// Suppress deprecation warnings from firebase-admin
process.noDeprecation = true;

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { generateToken, verifyToken, isAdmin } = require('./authMiddleware');
const { firebaseDB, initializeDemoData } = require('./firebase-database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow base64 photo uploads

const saltRounds = 10;

console.log("🔥 EMS Server Starting with Firebase Firestore...");
console.log("📋 Demo Login Credentials:");
console.log("   Admin: ADMIN001 / password");
console.log("   Employee: EMP001 / password");
console.log("🌐 Server will run on: http://localhost:5000");

// Initialize demo data
initializeDemoData().then(() => {
    console.log("✅ Firebase Firestore initialization complete");
}).catch(err => {
    console.warn("⚠️ Firebase initialization warning:", err.message);
    console.warn("Server will continue — using fallback login if quota exceeded");
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        database: 'Firebase Firestore'
    });
});

// ========== EMPLOYEES API ==========

// GET all employees (Protected)
app.get('/api/employees', verifyToken, async (req, res) => {
    try {
        const employees = await firebaseDB.getEmployees();
        const employeesWithoutPassword = employees.map(emp => {
            const { password_hash, ...empWithoutPassword } = emp;
            return empWithoutPassword;
        });
        res.json(employeesWithoutPassword);
    } catch (error) {
        console.log("GET employees error:", error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ADD new employee (Admin only)
app.post('/api/employees', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, id, department, salary, email, phone, join_date, password, role } = req.body;

        if (!password) {
            return res.json({ success: false, error: 'Password required' });
        }

        // Check if employee ID already exists
        const existing = await firebaseDB.getEmployeeById(id);
        if (existing) {
            return res.json({ success: false, error: 'Employee ID already exists' });
        }

        const hash = await bcrypt.hash(password, saltRounds);

        const employeeData = {
            id,
            name,
            department,
            salary: parseInt(salary),
            email,
            phone,
            join_date,
            password_hash: hash,
            role: role || 'employee',
            payroll_status: 'pending'
        };

        await firebaseDB.addEmployee(employeeData);
        console.log(`✅ New employee added: ${name} (${id})`);
        res.json({ success: true });
    } catch (error) {
        console.log("Add employee error:", error);
        res.json({ success: false, error: error.message });
    }
});

// UPDATE employee photo (own profile or admin)
app.put('/api/employees/:id/photo', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        if (req.user.id !== id && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const { photo_url } = req.body;
        if (!photo_url) return res.json({ success: false, error: 'No photo provided' });
        const result = await firebaseDB.updateEmployeePhoto(id, photo_url);
        console.log(`📷 Photo updated: ${id}`);
        res.json(result);
    } catch (error) {
        console.log('Update photo error:', error);
        res.json({ success: false, error: error.message });
    }
});

// UPDATE employee (Protected - own profile or admin)
app.put('/api/employees/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;

        // Check if user is updating their own profile or is admin
        if (req.user.id !== id && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { name, department, salary, email, phone, join_date, role } = req.body;

        const employee = await firebaseDB.getEmployeeById(id);
        if (!employee) {
            return res.json({ success: false, error: 'Employee not found' });
        }

        const updateData = {
            name,
            department,
            salary: parseInt(salary),
            email,
            phone,
            join_date,
            role: role || 'employee'
        };

        await firebaseDB.updateEmployee(id, updateData);
        console.log(`📝 Employee updated: ${name} (${id})`);
        res.json({ success: true });
    } catch (error) {
        console.log("Update employee error:", error);
        res.json({ success: false, error: error.message });
    }
});

// DELETE employee (Admin only)
app.delete('/api/employees/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const id = req.params.id;

        const employee = await firebaseDB.getEmployeeById(id);
        if (!employee) {
            return res.json({ success: false, error: 'Employee not found' });
        }

        await firebaseDB.deleteEmployee(id);
        console.log(`🗑️ Employee deleted: ${employee.name} (${id})`);
        res.json({ success: true });
    } catch (error) {
        console.log("Delete employee error:", error);
        res.json({ success: false, error: error.message });
    }
});

// ========== AUTHENTICATION ==========

// Fallback users for when Firestore quota is exceeded
const FALLBACK_USERS = {
    'ADMIN001': { id: 'ADMIN001', name: 'Admin User', role: 'admin', department: 'IT', salary: 80000, email: 'admin@company.com', phone: '1234567890', join_date: '2024-01-01', payroll_status: 'paid', password: 'password' },
    'EMP001': { id: 'EMP001', name: 'John Doe', role: 'employee', department: 'HR', salary: 50000, email: 'john@company.com', phone: '0987654321', join_date: '2024-01-15', payroll_status: 'pending', password: 'password' },
    'MGR001': { id: 'MGR001', name: 'Manager One', role: 'manager', department: 'IT', salary: 65000, email: 'mgr@company.com', phone: '1111111111', join_date: '2024-02-01', payroll_status: 'pending', password: 'password' },
};

// Login route (Generate JWT token)
app.post('/api/login', async (req, res) => {
    try {
        const { id, password } = req.body;

        let user = null;
        let passwordMatch = false;

        // Try Firestore first
        try {
            user = await firebaseDB.getEmployeeById(id);
            if (user && user.password_hash) {
                passwordMatch = await bcrypt.compare(password, user.password_hash);
            }
        } catch (firestoreError) {
            console.log(`⚠️ Firestore unavailable (quota?), using fallback login`);
        }

        // Fallback to hardcoded users if Firestore failed or user not found
        if (!user || !passwordMatch) {
            const fallback = FALLBACK_USERS[id];
            if (fallback && password === fallback.password) {
                const { password: _p, ...userWithoutPassword } = fallback;
                const token = generateToken(userWithoutPassword);
                console.log(`✅ Fallback login: ${fallback.name} (${id})`);
                return res.json({ success: true, user: userWithoutPassword, token });
            }
            // If Firestore user found but wrong password
            if (user && !passwordMatch) {
                console.log(`❌ Login failed: Wrong password for ${id}`);
                return res.json({ success: false, error: 'Wrong password' });
            }
            console.log(`❌ Login failed: Invalid ID (${id})`);
            return res.json({ success: false, error: 'Invalid ID' });
        }
        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;

        // Generate JWT token
        const token = generateToken(userWithoutPassword);

        console.log(`✅ Login successful: ${user.name} (${id})`);
        res.json({
            success: true,
            user: userWithoutPassword,
            token: token
        });
    } catch (error) {
        console.log("Login error:", error);
        res.json({ success: false, error: 'Login failed' });
    }
});

// ========== ATTENDANCE API ==========

// Mark attendance (Admin only) — supports any date via optional `date` field
app.post('/api/attendance', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id, name, department, status, date } = req.body;
        const targetDate = date || new Date().toISOString().split('T')[0];

        let clock_in = '-', clock_out = '-', hours = '—';

        if (status === 'present') {
            clock_in = '08:45 AM'; clock_out = '05:30 PM'; hours = '8h 45m';
        } else if (status === 'late') {
            clock_in = '10:15 AM'; clock_out = '05:30 PM'; hours = '7h 15m';
        } else if (status === 'leave') {
            clock_in = 'On Leave'; clock_out = 'On Leave'; hours = '8h (Leave)';
        }

        const attendanceData = {
            employee_id: id,
            name,
            department,
            status,
            clock_in,
            clock_out,
            hours,
            attendance_date: targetDate
        };

        await firebaseDB.markAttendance(attendanceData);
        console.log(`📋 Attendance marked: ${name} - ${status} on ${targetDate}`);
        res.json({ success: true });
    } catch (error) {
        console.log("POST attendance error:", error);
        res.json({ success: false, error: error.message });
    }
});

// GET today's attendance (Protected)
app.get('/api/attendance/today', verifyToken, async (req, res) => {
    try {
        const todayAttendance = await firebaseDB.getTodayAttendance();
        res.json(todayAttendance);
    } catch (error) {
        console.log("GET attendance error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET attendance by specific date (Protected)
app.get('/api/attendance/date/:date', verifyToken, async (req, res) => {
    try {
        const { date } = req.params;
        const dateAttendance = await firebaseDB.getAttendanceByDate(date);
        res.json(dateAttendance);
    } catch (error) {
        console.log("GET attendance by date error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET attendance by month (Protected)
app.get('/api/attendance/month/:year/:month', verifyToken, async (req, res) => {
    try {
        const { year, month } = req.params;
        const monthAttendance = await firebaseDB.getAttendanceByMonth(year, month);
        res.json(monthAttendance);
    } catch (error) {
        console.log("GET monthly attendance error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET all attendance (Protected)
app.get('/api/attendance/all', verifyToken, async (req, res) => {
    try {
        const allAttendance = await firebaseDB.getAllAttendance();
        res.json(allAttendance);
    } catch (error) {
        console.log("GET all attendance error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ========== PAYROLL API ==========

// Update payroll status (Admin only)
app.put('/api/payroll/status/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['paid', 'pending', 'processing'];
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, error: 'Invalid status' });
        }

        const employee = await firebaseDB.getEmployeeById(id);
        if (!employee) {
            return res.json({ success: false, error: 'Employee not found' });
        }

        await firebaseDB.updateEmployee(id, { payroll_status: status });
        console.log(`💰 Payroll status updated: ${id} - ${status}`);
        res.json({ success: true });
    } catch (error) {
        console.log("Payroll status update error:", error);
        res.json({ success: false });
    }
});

// ========== DEPARTMENTS API ==========

// GET all departments (Protected)
app.get('/api/departments', verifyToken, async (req, res) => {
    try {
        const departments = await firebaseDB.getDepartments();
        res.json(departments);
    } catch (error) {
        console.log('GET departments error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ADD department (Admin only)
app.post('/api/departments', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, head, head_id, budget, description } = req.body;
        if (!name) return res.json({ success: false, error: 'Department name required' });
        const result = await firebaseDB.addDepartment({ name, head: head || '', head_id: head_id || '', budget: budget || '', description: description || '' });
        console.log(`✅ Department added: ${name}`);
        res.json(result);
    } catch (error) {
        console.log('Add department error:', error);
        res.json({ success: false, error: error.message });
    }
});

// UPDATE department (Admin only)
app.put('/api/departments/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, head, head_id, budget, description } = req.body;
        const result = await firebaseDB.updateDepartment(id, { name, head: head || '', head_id: head_id || '', budget: budget || '', description: description || '' });
        console.log(`📝 Department updated: ${name}`);
        res.json(result);
    } catch (error) {
        console.log('Update department error:', error);
        res.json({ success: false, error: error.message });
    }
});

// DELETE department (Admin only)
app.delete('/api/departments/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await firebaseDB.deleteDepartment(id);
        console.log(`🗑️ Department deleted: ${id}`);
        res.json(result);
    } catch (error) {
        console.log('Delete department error:', error);
        res.json({ success: false, error: error.message });
    }
});

// ========== STATISTICS API ==========

// GET attendance summary for charts (Protected)
app.get('/api/attendance/summary-all', verifyToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        const summary = await firebaseDB.getAttendanceSummary(month, year);
        res.json(summary);
    } catch (error) {
        console.log("GET attendance summary error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET weekly attendance data for charts (Protected)
app.get('/api/attendance/weekly', verifyToken, async (req, res) => {
    try {
        const weeklyData = await firebaseDB.getWeeklyAttendance();
        res.json(weeklyData);
    } catch (error) {
        console.log("GET weekly attendance error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET department statistics (Protected)
app.get('/api/departments/stats', verifyToken, async (req, res) => {
    try {
        const departments = await firebaseDB.getDepartmentStats();
        res.json(departments);
    } catch (error) {
        console.log("GET department stats error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Server start
app.listen(5000, () => {
    console.log(`🚀 EMS Server running: http://localhost:5000`);
    console.log(`🔥 Database: Firebase Firestore`);
});
