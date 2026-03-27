import { useState, useEffect } from 'react';
import api from '../services/api';
import Navigation from './Navigation';

const Employees = () => {
    const [activeTab, setActiveTab] = useState('employees'); // 'employees' or 'departments'
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        department: '',
        salary: '',
        email: '',
        phone: '',
        join_date: '',
        role: 'employee',
        password: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Department management state
    const [departments, setDepartments] = useState([]);
    const [departmentForm, setDepartmentForm] = useState({
        name: '',
        head: '',
        head_id: '',
        budget: '',
        description: ''
    });
    const [editingDept, setEditingDept] = useState(null);
    const [showDeptForm, setShowDeptForm] = useState(false);

    useEffect(() => {
        loadEmployees();
        loadDepartments();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await api.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error loading employees:', error);
            alert('Error loading employees from Firebase');
        } finally {
            setLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const data = await api.getDepartments();
            setDepartments(data);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const result = await api.updateEmployee(editingId, formData);
                if (result.success) {
                    alert('✅ Employee updated successfully!');
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } else {
                const result = await api.addEmployee(formData);
                if (result.success) {
                    alert('✅ Employee added successfully!');
                } else {
                    alert('❌ Error: ' + result.error);
                }
            }
            resetForm();
            loadEmployees();
        } catch (error) {
            alert('❌ Error: ' + error.message);
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
            role: 'employee',
            password: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (employee) => {
        setFormData({
            name: employee.name || '',
            id: employee.id || '',
            department: employee.department || '',
            salary: employee.salary || '',
            email: employee.email || '',
            phone: employee.phone || '',
            join_date: employee.join_date ? employee.join_date.split('T')[0] : '',
            role: employee.role || 'employee',
            password: ''
        });
        setEditingId(employee.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                const result = await api.deleteEmployee(id);
                if (result.success) {
                    alert('✅ Employee deleted successfully!');
                    loadEmployees();
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error deleting employee: ' + error.message);
            }
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Department management functions
    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedHead = employees.find(emp => emp.id === departmentForm.head_id);
            const payload = {
                name: departmentForm.name,
                head: selectedHead?.name || '',
                head_id: departmentForm.head_id || '',
                budget: departmentForm.budget,
                description: departmentForm.description
            };

            if (editingDept) {
                const result = await api.updateDepartment(editingDept, payload);
                if (result.success) {
                    alert('✅ Department updated successfully!');
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } else {
                const result = await api.addDepartment(payload);
                if (result.success) {
                    alert('✅ Department added successfully!');
                } else {
                    alert('❌ Error: ' + result.error);
                }
            }
            resetDeptForm();
            loadDepartments();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    };

    const resetDeptForm = () => {
        setDepartmentForm({ name: '', head: '', head_id: '', budget: '', description: '' });
        setEditingDept(null);
        setShowDeptForm(false);
    };

    const handleEditDept = (dept) => {
        setDepartmentForm({
            name: dept.name,
            head: dept.head || '',
            head_id: dept.head_id || '',
            budget: dept.budget || '',
            description: dept.description || ''
        });
        setEditingDept(dept.id);
        setShowDeptForm(true);
    };

    const handleDeleteDept = async (dept) => {
        if (dept.employeeCount > 0) {
            alert(`❌ Cannot delete "${dept.name}" — it has ${dept.employeeCount} employee(s). Reassign them first.`);
            return;
        }
        if (window.confirm(`Delete department "${dept.name}"?`)) {
            try {
                const result = await api.deleteDepartment(dept.id);
                if (result.success) {
                    alert('✅ Department deleted!');
                    loadDepartments();
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }
    };

    return (
        <div>
            <Navigation />
            <div style={{ paddingTop: '6rem', paddingBottom: '5rem' }}>
                <div className="container text-center" style={{ marginBottom: '2rem' }} data-aos="fade-up">
                    <h1 className="page-title">Employee Management</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>Manage employees and departments</p>
                </div>

                {/* Tab Selector */}
                <div className="container" style={{ marginBottom: '2rem' }}>
                    <div className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }} data-aos="fade-up">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ minWidth: '10rem' }}
                        >
                            <i className="fas fa-users"></i>
                            Employees
                        </button>
                        <button
                            onClick={() => setActiveTab('departments')}
                            className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ minWidth: '10rem' }}
                        >
                            <i className="fas fa-building"></i>
                            Departments
                        </button>
                    </div>
                </div>

                {/* Employees Tab */}
                {activeTab === 'employees' && (
                    <>
                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-lg">
                                <i className="fas fa-plus"></i>
                                {showForm ? 'Cancel' : 'Add New Employee'}
                            </button>
                        </div>
                        {showForm && (
                            <div className="container" style={{ marginBottom: '4rem' }}>
                                <div className="glass" style={{ padding: '2rem' }} data-aos="fade-up">
                                    <h2 className="section-title">{editingId ? 'Update Employee' : 'Add New Employee'}</h2>
                                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Employee ID</label>
                                            <input type="text" className="form-input" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} required disabled={editingId} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Department</label>
                                            <select className="form-input" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required>
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Basic Salary</label>
                                            <input type="number" className="form-input" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Join Date</label>
                                            <input type="date" className="form-input" value={formData.join_date} onChange={(e) => setFormData({ ...formData, join_date: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role</label>
                                            <select className="form-input" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                                <option value="employee">Employee</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        {!editingId && (
                                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                <label className="form-label">Password</label>
                                                <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingId} placeholder="Enter strong password" />
                                            </div>
                                        )}
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                                {editingId ? 'Update Employee' : 'Add Employee'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }} data-aos="fade-up">
                                <input type="text" className="form-input" placeholder="Search by name, ID, or department..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="container">
                            <div className="glass" style={{ overflow: 'hidden' }} data-aos="fade-up">
                                <div style={{ padding: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>All Employees ({filteredEmployees.length})</h2>
                                </div>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                                        <p>Loading employees...</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%' }}>
                                            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                                <tr>
                                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Name</th>
                                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Department</th>
                                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Salary</th>
                                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Email</th>
                                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Role</th>
                                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                                                {filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map((emp) => (
                                                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '1.5rem 2rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--success-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                                                                        {emp.name ? emp.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name || 'N/A'}</div>
                                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{emp.id || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1.5rem 2rem', color: 'var(--text-secondary)' }}>{emp.department || 'N/A'}</td>
                                                            <td style={{ padding: '1.5rem 2rem', fontWeight: '600', color: 'var(--success-color)' }}>₹{parseFloat(emp.salary || 0).toLocaleString('en-IN')}</td>
                                                            <td style={{ padding: '1.5rem 2rem', color: 'var(--text-secondary)' }}>{emp.email || 'N/A'}</td>
                                                            <td style={{ padding: '1.5rem 2rem' }}>
                                                                <span className={`status-badge ${emp.role === 'admin' ? 'status-error' : emp.role === 'manager' ? 'status-warning' : 'status-info'}`}>
                                                                    {emp.role ? emp.role.charAt(0).toUpperCase() + emp.role.slice(1) : 'Employee'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                                                    <button className="btn btn-warning btn-sm" onClick={() => handleEdit(emp)}>
                                                                        <i className="fas fa-edit"></i> Edit
                                                                    </button>
                                                                    <button className="btn btn-sm" style={{ background: 'var(--error-color)', color: 'white' }} onClick={() => handleDelete(emp.id)}>
                                                                        <i className="fas fa-trash"></i> Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>No employees found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Departments Tab */}
                {activeTab === 'departments' && (
                    <>
                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <button onClick={() => setShowDeptForm(!showDeptForm)} className="btn btn-primary btn-lg">
                                <i className="fas fa-plus"></i>
                                {showDeptForm ? 'Cancel' : 'Add New Department'}
                            </button>
                        </div>

                        {showDeptForm && (
                            <div className="container" style={{ marginBottom: '4rem' }}>
                                <div className="glass" style={{ padding: '2rem' }} data-aos="fade-up">
                                    <h2 className="section-title">{editingDept ? 'Update Department' : 'Add New Department'}</h2>
                                    <form onSubmit={handleDeptSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Department Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={departmentForm.name}
                                                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                                                required
                                                placeholder="e.g., IT, HR, Sales"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Department Head</label>
                                            <select
                                                className="form-input"
                                                value={departmentForm.head_id}
                                                onChange={(e) => setDepartmentForm({ ...departmentForm, head_id: e.target.value })}
                                            >
                                                <option value="">-- Select Head --</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.name} ({emp.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Annual Budget</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={departmentForm.budget}
                                                onChange={(e) => setDepartmentForm({ ...departmentForm, budget: e.target.value })}
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-input"
                                                value={departmentForm.description}
                                                onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                                                rows="3"
                                                placeholder="Department description (optional)"
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                                {editingDept ? 'Update Department' : 'Add Department'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="container">
                            <div className="glass" style={{ overflow: 'hidden' }} data-aos="fade-up">
                                <div style={{ padding: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                                        All Departments ({departments.length})
                                    </h2>
                                </div>
                                {departments.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem', padding: '0 2rem 2rem' }}>
                                        {departments.map((dept, index) => (
                                            <div
                                                key={dept.name}
                                                className="glass card"
                                                style={{ padding: '1.5rem' }}
                                                data-aos="fade-up"
                                                data-aos-delay={index * 100}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                                    <div style={{
                                                        width: '3rem',
                                                        height: '3rem',
                                                        borderRadius: '0.75rem',
                                                        background: 'var(--primary-gradient)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '1.25rem'
                                                    }}>
                                                        <i className="fas fa-building"></i>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                            {dept.name}
                                                        </h3>
                                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                                            {dept.employeeCount} {dept.employeeCount === 1 ? 'Employee' : 'Employees'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <i className="fas fa-user-tie" style={{ color: 'var(--primary-color)', fontSize: '0.875rem' }}></i>
                                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                            Head: <strong style={{ color: 'var(--text-primary)' }}>{dept.headName || dept.head || 'N/A'}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        style={{ flex: 1 }}
                                                        onClick={() => handleEditDept(dept)}
                                                    >
                                                        <i className="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ flex: 1, background: 'var(--error-color)', color: 'white' }}
                                                        onClick={() => handleDeleteDept(dept)}
                                                    >
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                                        <i className="fas fa-building" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                        <p>No departments found. Add employees to create departments.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Employees;
