/**
 * Initialize Firebase with Demo Data
 * 
 * Run this once to populate your Firebase Firestore with initial employee data.
 * 
 * HOW TO USE:
 * 1. Import this in your App.js or any component
 * 2. Call initializeFirebaseData() once
 * 3. Check Firebase Console to see the data
 */

import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const demoEmployees = [
    {
        id: 'ADMIN001',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'admin',
        department: 'IT',
        salary: 80000,
        phone: '1234567890',
        join_date: '2024-01-01',
        password: 'password',
        payroll_status: 'paid'
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
        password: 'password',
        payroll_status: 'pending'
    },
    {
        id: 'MGR001',
        name: 'hemant',
        email: 'hemant@company.com',
        role: 'manager',
        department: 'Sales',
        salary: 65000,
        phone: '1122334455',
        join_date: '2023-06-10',
        password: 'password',
        payroll_status: 'paid'
    },
    {
        id: 'EMP002',
        name: 'raj',
        email: 'raj@company.com',
        role: 'employee',
        department: 'IT',
        salary: 55000,
        phone: '2233445566',
        join_date: '2024-02-01',
        password: 'password',
        payroll_status: 'pending'
    },
    {
        id: 'EMP003',
        name: 'meet',
        email: 'meet@company.com',
        role: 'employee',
        department: 'Marketing',
        salary: 52000,
        phone: '3344556677',
        join_date: '2024-01-20',
        password: 'password',
        payroll_status: 'processing'
    }
];

export const initializeFirebaseData = async () => {
    try {
        console.log('🔥 Starting Firebase initialization...');

        // Check if data already exists
        const employeesSnapshot = await getDocs(collection(db, 'employees'));

        if (!employeesSnapshot.empty) {
            console.log('⚠️ Firebase already has data. Skipping initialization.');
            console.log(`Found ${employeesSnapshot.size} employees in database.`);
            return {
                success: false,
                message: 'Data already exists',
                count: employeesSnapshot.size
            };
        }

        // Add demo employees
        console.log('📝 Adding demo employees to Firebase...');

        for (const employee of demoEmployees) {
            await setDoc(doc(db, 'employees', employee.id), {
                ...employee,
                created_at: new Date().toISOString()
            });
            console.log(`✅ Added: ${employee.name} (${employee.id})`);
        }

        console.log('🎉 Firebase initialization complete!');
        console.log(`✅ Added ${demoEmployees.length} employees`);
        console.log('\n📋 Demo Login Credentials:');
        console.log('   Admin: ADMIN001 / password');
        console.log('   Manager: MGR001 / password');
        console.log('   Employee: EMP001 / password');

        return {
            success: true,
            message: 'Firebase initialized successfully',
            count: demoEmployees.length
        };

    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
};

// Generate sample attendance data for the past week
export const generateSampleAttendance = async () => {
    try {
        console.log('📅 Generating sample attendance data...');

        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employees = [];
        employeesSnapshot.forEach(doc => {
            employees.push({ id: doc.id, ...doc.data() });
        });

        if (employees.length === 0) {
            console.log('⚠️ No employees found. Please initialize employees first.');
            return { success: false, message: 'No employees found' };
        }

        const today = new Date();
        const statuses = ['present', 'late', 'absent', 'leave'];
        let count = 0;

        // Generate data for the past 7 days
        for (let i = 6; i >= 0; i--) {
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

                await setDoc(doc(collection(db, 'attendance')), {
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

                count++;
            }
        }

        console.log(`✅ Generated ${count} attendance records`);
        return {
            success: true,
            message: 'Sample attendance generated',
            count: count
        };

    } catch (error) {
        console.error('❌ Error generating attendance:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
};

// Initialize everything at once
export const initializeEverything = async () => {
    console.log('🚀 Initializing complete Firebase database...\n');

    const employeesResult = await initializeFirebaseData();

    if (employeesResult.success) {
        console.log('\n');
        const attendanceResult = await generateSampleAttendance();

        return {
            success: true,
            employees: employeesResult,
            attendance: attendanceResult
        };
    }

    return employeesResult;
};

export default {
    initializeFirebaseData,
    generateSampleAttendance,
    initializeEverything
};
