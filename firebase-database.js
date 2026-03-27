// Firebase Admin SDK for backend
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin with service account
let db;
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully');
} catch (e) {
    console.warn('⚠️ Firebase Admin init failed:', e.message);
    db = null;
}

// Collections
const EMPLOYEES_COLLECTION = 'employees';
const ATTENDANCE_COLLECTION = 'attendance';
const DEPARTMENTS_COLLECTION = 'departments';

// Initialize with demo data if Firebase is available
async function initializeDemoData() {
    if (!db) { console.warn('⚠️ Skipping demo data — Firestore not available'); return; }
    try {
        const employeesSnapshot = await db.collection(EMPLOYEES_COLLECTION).limit(1).get();

        if (employeesSnapshot.empty) {
            console.log('📊 Initializing Firebase with demo data...');

            // Add demo employees
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash('password', saltRounds);

            const employees = [
                {
                    id: 'ADMIN001',
                    name: 'Admin User',
                    email: 'admin@company.com',
                    role: 'admin',
                    department: 'IT',
                    salary: 80000,
                    phone: '1234567890',
                    join_date: '2024-01-01',
                    password_hash: passwordHash,
                    payroll_status: 'paid',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'EMP001',
                    name: 'John Doe',
                    email: 'john@company.com',
                    role: 'employee',
                    department: 'HR',
                    salary: 50000,
                    phone: '0987654321',
                    join_date: '2024-01-15',
                    password_hash: passwordHash,
                    payroll_status: 'pending',
                    created_at: new Date().toISOString()
                }
            ];

            // Add employees to Firestore
            for (const emp of employees) {
                await db.collection(EMPLOYEES_COLLECTION).doc(emp.id).set(emp);
            }

            // Generate sample attendance data
            const today = new Date();
            const attendanceRecords = [];

            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                for (const emp of employees) {
                    let status;
                    if (isWeekend) {
                        status = Math.random() < 0.8 ? 'absent' : 'leave';
                    } else {
                        const rand = Math.random();
                        if (rand < 0.75) status = 'present';
                        else if (rand < 0.85) status = 'late';
                        else if (rand < 0.95) status = 'leave';
                        else status = 'absent';
                    }

                    let clock_in = '-', clock_out = '-', hours = '—';

                    if (status === 'present') {
                        clock_in = '08:45 AM';
                        clock_out = '05:30 PM';
                        hours = '8h 45m';
                    } else if (status === 'late') {
                        clock_in = '10:15 AM';
                        clock_out = i === 0 ? 'In Progress' : '05:30 PM';
                        hours = i === 0 ? 'In Progress' : '7h 15m';
                    } else if (status === 'leave') {
                        clock_in = 'On Leave';
                        clock_out = 'On Leave';
                        hours = '8h (Leave)';
                    }

                    attendanceRecords.push({
                        employee_id: emp.id,
                        name: emp.name,
                        department: emp.department,
                        attendance_date: dateStr,
                        status,
                        clock_in,
                        clock_out,
                        hours,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Add attendance records in batches
            const batch = db.batch();
            attendanceRecords.forEach((record) => {
                const docRef = db.collection(ATTENDANCE_COLLECTION).doc();
                batch.set(docRef, record);
            });
            await batch.commit();

            console.log(`✅ Added ${employees.length} employees and ${attendanceRecords.length} attendance records`);
        } else {
            console.log('✅ Firebase already has data');
        }
    } catch (error) {
        console.error('❌ Error initializing demo data:', error);
        throw error;
    }
}

// Database operations
const firebaseDB = {
    // Employees
    async getEmployees() {
        if (!db) return [];
        try {
            const snapshot = await db.collection(EMPLOYEES_COLLECTION).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.warn('getEmployees error:', e.message); return []; }
    },

    async getEmployeeById(id) {
        if (!db) return null;
        try {
            const doc = await db.collection(EMPLOYEES_COLLECTION).doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (e) { console.warn('getEmployeeById error:', e.message); return null; }
    },

    async addEmployee(employeeData) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            await db.collection(EMPLOYEES_COLLECTION).doc(employeeData.id).set({
                ...employeeData,
                created_at: new Date().toISOString()
            });
            return { success: true };
        } catch (e) { console.warn('addEmployee error:', e.message); return { success: false, error: e.message }; }
    },

    async updateEmployee(id, employeeData) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            await db.collection(EMPLOYEES_COLLECTION).doc(id).update({
                ...employeeData,
                updated_at: new Date().toISOString()
            });
            return { success: true };
        } catch (e) { console.warn('updateEmployee error:', e.message); return { success: false, error: e.message }; }
    },

    async updateEmployeePhoto(id, photoBase64) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            await db.collection(EMPLOYEES_COLLECTION).doc(id).update({
                photo_url: photoBase64,
                updated_at: new Date().toISOString()
            });
            return { success: true };
        } catch (e) { console.warn('updateEmployeePhoto error:', e.message); return { success: false, error: e.message }; }
    },

    async deleteEmployee(id) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            await db.collection(EMPLOYEES_COLLECTION).doc(id).delete();
            const attendanceSnapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('employee_id', '==', id).get();
            const batch = db.batch();
            attendanceSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            return { success: true };
        } catch (e) { console.warn('deleteEmployee error:', e.message); return { success: false, error: e.message }; }
    },

    // Attendance
    async getTodayAttendance() {
        if (!db) return [];
        try {
            const today = new Date().toISOString().split('T')[0];
            const snapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('attendance_date', '==', today)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.warn('getTodayAttendance error:', e.message); return []; }
    },

    async getAttendanceByDate(date) {
        if (!db) return [];
        try {
            const snapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('attendance_date', '==', date)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.warn('getAttendanceByDate error:', e.message); return []; }
    },

    async getAttendanceByMonth(year, month) {
        if (!db) return [];
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
            const snapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('attendance_date', '>=', startDate)
                .where('attendance_date', '<=', endDate)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.warn('getAttendanceByMonth error:', e.message); return []; }
    },

    async getAllAttendance() {
        if (!db) return [];
        try {
            const snapshot = await db.collection(ATTENDANCE_COLLECTION).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.warn('getAllAttendance error:', e.message); return []; }
    },

    async markAttendance(attendanceData) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            // Use provided date or fallback to today
            const targetDate = attendanceData.attendance_date || new Date().toISOString().split('T')[0];
            const existingSnapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('employee_id', '==', attendanceData.employee_id)
                .where('attendance_date', '==', targetDate).get();
            const batch = db.batch();
            existingSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            const newDocRef = db.collection(ATTENDANCE_COLLECTION).doc();
            batch.set(newDocRef, {
                ...attendanceData,
                attendance_date: targetDate,
                timestamp: new Date().toISOString()
            });
            await batch.commit();
            return { success: true };
        } catch (e) { console.warn('markAttendance error:', e.message); return { success: false, error: e.message }; }
    },

    // Statistics
    async getWeeklyAttendance() {
        if (!db) return [];
        try {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            const weeklyData = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const snapshot = await db.collection(ATTENDANCE_COLLECTION)
                    .where('attendance_date', '==', dateStr).get();
                const dayData = { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], present: 0, late: 0, absent: 0, leave: 0 };
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'present') dayData.present++;
                    else if (data.status === 'late') dayData.late++;
                    else if (data.status === 'absent') dayData.absent++;
                    else if (data.status === 'leave') dayData.leave++;
                });
                weeklyData.push(dayData);
            }
            return weeklyData;
        } catch (e) { console.warn('getWeeklyAttendance error:', e.message); return []; }
    },

    async getAttendanceSummary(month, year) {
        if (!db) return { present: 0, late: 0, absent: 0, leave: 0 };
        try {
            const currentMonth = month || new Date().getMonth() + 1;
            const currentYear = year || new Date().getFullYear();
            const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;
            const snapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('attendance_date', '>=', startDate)
                .where('attendance_date', '<=', endDate).get();
            const summary = { present: 0, late: 0, absent: 0, leave: 0 };
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'present') summary.present++;
                else if (data.status === 'late') summary.late++;
                else if (data.status === 'absent') summary.absent++;
                else if (data.status === 'leave') summary.leave++;
            });
            return summary;
        } catch (e) { console.warn('getAttendanceSummary error:', e.message); return { present: 0, late: 0, absent: 0, leave: 0 }; }
    },

    async getDepartmentStats() {
        if (!db) return {};
        try {
            const snapshot = await db.collection(EMPLOYEES_COLLECTION).get();
            const departments = {};
            snapshot.docs.forEach(doc => {
                const emp = doc.data();
                const dept = emp.department || 'Other';
                if (!departments[dept]) departments[dept] = { count: 0, totalSalary: 0, avgSalary: 0 };
                departments[dept].count++;
                departments[dept].totalSalary += parseFloat(emp.salary || 0);
            });
            Object.keys(departments).forEach(dept => {
                departments[dept].avgSalary = Math.round(departments[dept].totalSalary / departments[dept].count);
            });
            return departments;
        } catch (e) { console.warn('getDepartmentStats error:', e.message); return {}; }
    },

    // Departments CRUD
    async getDepartments() {
        if (!db) return [];
        try {
            const snapshot = await db.collection(DEPARTMENTS_COLLECTION).orderBy('created_at', 'asc').get();
            const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const empSnapshot = await db.collection(EMPLOYEES_COLLECTION).get();
            const employees = empSnapshot.docs.map(doc => doc.data());
            return depts.map(dept => ({
                ...dept,
                employeeCount: employees.filter(emp => emp.department === dept.name).length,
                headName: employees.find(emp => emp.id === dept.head_id)?.name || dept.head || 'N/A'
            }));
        } catch (e) { console.warn('getDepartments error:', e.message); return []; }
    },

    async addDepartment(deptData) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            const existing = await db.collection(DEPARTMENTS_COLLECTION)
                .where('name', '==', deptData.name).get();
            if (!existing.empty) throw new Error('Department already exists');
            const docRef = await db.collection(DEPARTMENTS_COLLECTION).add({
                ...deptData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            return { success: true, id: docRef.id };
        } catch (e) { console.warn('addDepartment error:', e.message); return { success: false, error: e.message }; }
    },

    async updateDepartment(id, deptData) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            await db.collection(DEPARTMENTS_COLLECTION).doc(id).update({
                ...deptData,
                updated_at: new Date().toISOString()
            });
            return { success: true };
        } catch (e) { console.warn('updateDepartment error:', e.message); return { success: false, error: e.message }; }
    },

    async deleteDepartment(id) {
        if (!db) return { success: false, error: 'Database unavailable' };
        try {
            await db.collection(DEPARTMENTS_COLLECTION).doc(id).delete();
            return { success: true };
        } catch (e) { console.warn('deleteDepartment error:', e.message); return { success: false, error: e.message }; }
    }
};

module.exports = { firebaseDB, initializeDemoData };
