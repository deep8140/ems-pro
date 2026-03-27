import { db } from './config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';

// Collections
const EMPLOYEES_COLLECTION = 'employees';
const ATTENDANCE_COLLECTION = 'attendance';

// ========== EMPLOYEES ==========

// Get all employees
export const getAllEmployees = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
        const employees = [];
        querySnapshot.forEach((doc) => {
            employees.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: employees };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get employee by ID
export const getEmployeeById = async (employeeId) => {
    try {
        const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Employee not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Add new employee
export const addEmployee = async (employeeData) => {
    try {
        const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), {
            ...employeeData,
            created_at: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update employee
export const updateEmployee = async (employeeId, employeeData) => {
    try {
        const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
        await updateDoc(docRef, {
            ...employeeData,
            updated_at: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete employee
export const deleteEmployee = async (employeeId) => {
    try {
        await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ========== ATTENDANCE ==========

// Get all attendance records
export const getAllAttendance = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION));
        const attendance = [];
        querySnapshot.forEach((doc) => {
            attendance.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: attendance };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get today's attendance
export const getTodayAttendance = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('attendance_date', '==', today)
        );
        const querySnapshot = await getDocs(q);
        const attendance = [];
        querySnapshot.forEach((doc) => {
            attendance.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: attendance };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Mark attendance
export const markAttendance = async (attendanceData) => {
    try {
        const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
            ...attendanceData,
            timestamp: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get attendance by employee ID
export const getAttendanceByEmployee = async (employeeId) => {
    try {
        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('employee_id', '==', employeeId),
            orderBy('attendance_date', 'desc'),
            limit(30)
        );
        const querySnapshot = await getDocs(q);
        const attendance = [];
        querySnapshot.forEach((doc) => {
            attendance.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: attendance };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
