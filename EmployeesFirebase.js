import React, { useState, useEffect } from 'react';
import {
    getAllEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
} from '../firebase/firestoreService';
import Navigation from './Navigation';

/**
 * EXAMPLE: Employees Component with Firebase Integration
 * 
 * This is an example showing how to use Firebase instead of the local API.
 * To use this component, replace the import in App.js:
 * 
 * From: import Employees from './components/Employees';
 * To:   import Employees from './components/EmployeesFirebase';
 */

function EmployeesFirebase() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        department: '',
        salary: '',
        email: '',
        phone: '',
        join_date: '',
        role: 'employee'
    });

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser?.role || 'employee';

    useEffect(() => {
        loadEmployees();
    }, []);

    useEffect(() => {
        const filtered = employees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    const loadEmployees = async () => {
        setLoading(true);
        const result = await getAllEmployees();

        if (result.success) {
            setEmployees(result.data);
            setFilteredEmployees(result.data);
        } else {
            console.error('Error loading employees:', result.error);
            alert('❌ Error loading employees: ' + result.error);
        }

        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingEmployee) {
            // Update existing employee
            const result = await updateEmployee(editingEmployee.id, formData);

            if (result.success) {
                alert('✅ Employee updated successfully!');
                setShowModal(false);
                resetForm();
                loadEmployees();
            } else {
                alert('❌ Error updating employee: ' + result.error);
            }
        } else {
            // Add new employee
            const result = await addEmployee(formData);

            if (result.success) {
                alert('✅ Employee added successfully!');
                setShowModal(false);
                resetForm();
                loadEmployees();
            } else {
                alert('❌ Error adding employee: ' + result.error);
            }
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            name: employee.name || '',
            id: employee.id || '',
            department: employee.department || '',
            salary: employee.salary || '',
            email: employee.email || '',
            phone: employee.phone || '',
            join_date: employee.join_date || '',
            role: employee.role || 'employee'
        });
        setShowModal(true);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            const result = await deleteEmployee(id);

            if (result.success) {
                alert('✅ Employee deleted successfully!');
                loadEmployees();
            } else {
                alert('❌ Error deleting employee: ' + result.error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            id: '',
            department: '',
            salary: '',
            email: '',
            phone: '',
            join_date: '',
            role: 'employee'
        });
        setEditingEmployee(null);
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    return (
        <div>
            <Navigation />
            <div style={{ paddingTop: '6rem', paddingBottom: '5rem' }}>
                <div className="container text-center" style={{ marginBottom: '4rem' }} data-aos="fade-up">
                    <h1 className="page-title">Employee Management (Firebase)</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                        Manage your team with Firebase Firestore
                    </p>
                </div>

                <div className="container" style={{ marginBottom: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }} data-aos="fade-up">
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="form-input"
                            style={{ flex: 1, minWidth: '250px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {(userRole === 'admin' || userRole === 'manager') && (
                            <button onClick={handleAddNew} className="btn btn-primary">
                                <i className="fas fa-plus"></i> Add Employee
                            </button>
                        )}
                    </div>
                </div>

                <div className="container">
                    <div className="glass" style={{ overflow: 'hidden' }} data-aos="fade-up">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Employee</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Department</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Role</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Salary</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Join Date</th>
                                        {(userRole === 'admin' || userRole === 'manager') && (
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                                                Loading employees from Firebase...
                                            </td>
                                        </tr>
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                                                No employees found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp, index) => (
                                            <tr key={emp.id} data-aos="fade-up" data-aos-delay={index * 50}>
                                                <td style={{ padding: '1.5rem 2rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            width: '3rem',
                                                            height: '3rem',
                                                            borderRadius: '50%',
                                                            background: 'var(--primary-gradient)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: '700'
                                                        }}>
                                                            {emp.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{emp.name}</p>
                                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{emp.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem 2rem' }}>{emp.department || 'N/A'}</td>
                                                <td style={{ padding: '1.5rem 2rem' }}>
                                                    <span className={`status-badge status-${emp.role === 'admin' ? 'error' : emp.role === 'manager' ? 'warning' : 'success'}`}>
                                                        {emp.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.5rem 2rem', color: 'var(--success-color)', fontWeight: '600' }}>
                                                    ₹{parseFloat(emp.salary || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '1.5rem 2rem' }}>
                                                    {emp.join_date ? new Date(emp.join_date).toLocaleDateString('en-IN') : 'N/A'}
                                                </td>
                                                {(userRole === 'admin' || userRole === 'manager') && (
                                                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                                                        <button onClick={() => handleEdit(emp)} className="btn btn-sm" style={{ marginRight: '0.5rem' }}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button onClick={() => handleDelete(emp.id, emp.name)} className="btn btn-sm" style={{ background: 'var(--error-color)' }}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal for Add/Edit */}
                {showModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div className="glass" style={{ maxWidth: '600px', width: '90%', padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>
                                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                                <input
                                    type="text"
                                    name="id"
                                    placeholder="Employee ID"
                                    className="form-input"
                                    value={formData.id}
                                    onChange={handleInputChange}
                                    disabled={editingEmployee}
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                                <input
                                    type="text"
                                    name="department"
                                    placeholder="Department"
                                    className="form-input"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                />
                                <input
                                    type="number"
                                    name="salary"
                                    placeholder="Salary"
                                    className="form-input"
                                    value={formData.salary}
                                    onChange={handleInputChange}
                                    required
                                />
                                <input
                                    type="date"
                                    name="join_date"
                                    className="form-input"
                                    value={formData.join_date}
                                    onChange={handleInputChange}
                                    required
                                />
                                <select
                                    name="role"
                                    className="form-input"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingEmployee ? 'Update' : 'Add'} Employee
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="btn btn-secondary"
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmployeesFirebase;
