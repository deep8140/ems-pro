// API service that connects to simple-server.js backend with JWT authentication
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add JWT token to all requests
apiClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 errors (token expired or invalid)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - logout user
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('authUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const api = {
    // ========== EMPLOYEES API ==========

    // Get all employees
    getEmployees: async () => {
        try {
            const response = await apiClient.get('/api/employees');
            return response.data;
        } catch (error) {
            console.error('Error getting employees:', error);
            throw error;
        }
    },

    // Add new employee
    addEmployee: async (employeeData) => {
        try {
            const response = await apiClient.post('/api/employees', employeeData);
            return response.data;
        } catch (error) {
            console.error('Error adding employee:', error);
            return { success: false, error: error.message };
        }
    },

    // Update employee
    updateEmployee: async (id, employeeData) => {
        try {
            const response = await apiClient.put(`/api/employees/${id}`, employeeData);
            return response.data;
        } catch (error) {
            console.error('Error updating employee:', error);
            return { success: false, error: error.message };
        }
    },

    // Update employee photo (base64)
    updatePhoto: async (id, photoBase64) => {
        try {
            const response = await apiClient.put(`/api/employees/${id}/photo`, { photo_url: photoBase64 });
            return response.data;
        } catch (error) {
            console.error('Error updating photo:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete employee
    deleteEmployee: async (id) => {
        try {
            const response = await apiClient.delete(`/api/employees/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting employee:', error);
            return { success: false, error: error.message };
        }
    },

    // Login (no token required)
    login: async (id, password) => {
        try {
            const response = await axios.post('/api/login', { id, password });
            return response.data;
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: 'Login failed' };
        }
    },

    // ========== ATTENDANCE API ==========

    // Get all attendance
    getAttendance: async () => {
        try {
            const response = await apiClient.get('/api/attendance/all');
            return response.data;
        } catch (error) {
            console.error('Error getting attendance:', error);
            throw error;
        }
    },

    // Get today's attendance
    getTodayAttendance: async () => {
        try {
            const response = await apiClient.get('/api/attendance/today');
            return response.data;
        } catch (error) {
            console.error('Error getting today attendance:', error);
            throw error;
        }
    },

    // Get attendance by specific date
    getAttendanceByDate: async (date) => {
        try {
            const response = await apiClient.get(`/api/attendance/date/${date}`);
            return response.data;
        } catch (error) {
            console.error('Error getting attendance by date:', error);
            throw error;
        }
    },

    // Get attendance by month
    getAttendanceByMonth: async (year, month) => {
        try {
            const response = await apiClient.get(`/api/attendance/month/${year}/${month}`);
            return response.data;
        } catch (error) {
            console.error('Error getting monthly attendance:', error);
            throw error;
        }
    },

    // Mark attendance
    markAttendance: async (attendanceData) => {
        try {
            const response = await apiClient.post('/api/attendance', {
                id: attendanceData.id,
                name: attendanceData.name,
                department: attendanceData.department,
                status: attendanceData.status,
                date: attendanceData.date || null
            });
            return response.data;
        } catch (error) {
            console.error('Error marking attendance:', error);
            return { success: false, error: error.message };
        }
    },

    // ========== PAYROLL API ==========

    // Update payroll status
    updatePayrollStatus: async (id, status) => {
        try {
            const response = await apiClient.put(`/api/payroll/status/${id}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating payroll status:', error);
            return { success: false, error: error.message };
        }
    },

    // ========== DASHBOARD/STATS API ==========

    // Get weekly attendance for charts
    getWeeklyAttendance: async () => {
        try {
            const response = await apiClient.get('/api/attendance/weekly');
            return response.data;
        } catch (error) {
            console.error('Error getting weekly attendance:', error);
            throw error;
        }
    },

    // Get attendance summary
    getAttendanceSummary: async (month, year) => {
        try {
            const params = {};
            if (month) params.month = month;
            if (year) params.year = year;

            const response = await apiClient.get('/api/attendance/summary-all', { params });
            return response.data;
        } catch (error) {
            console.error('Error getting attendance summary:', error);
            throw error;
        }
    },

    // Get department statistics
    getDepartmentStats: async () => {
        try {
            const response = await apiClient.get('/api/departments/stats');
            return response.data;
        } catch (error) {
            console.error('Error getting department stats:', error);
            throw error;
        }
    },

    // ========== DEPARTMENTS API ==========

    getDepartments: async () => {
        try {
            const response = await apiClient.get('/api/departments');
            return response.data;
        } catch (error) {
            console.error('Error getting departments:', error);
            throw error;
        }
    },

    addDepartment: async (deptData) => {
        try {
            const response = await apiClient.post('/api/departments', deptData);
            return response.data;
        } catch (error) {
            console.error('Error adding department:', error);
            return { success: false, error: error.message };
        }
    },

    updateDepartment: async (id, deptData) => {
        try {
            const response = await apiClient.put(`/api/departments/${id}`, deptData);
            return response.data;
        } catch (error) {
            console.error('Error updating department:', error);
            return { success: false, error: error.message };
        }
    },

    deleteDepartment: async (id) => {
        try {
            const response = await apiClient.delete(`/api/departments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting department:', error);
            return { success: false, error: error.message };
        }
    }
};

export default api;
