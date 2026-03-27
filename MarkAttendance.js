import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SkeletonRow = () => (
    <tr>
        {[1, 2, 3, 4, 5].map(i => (
            <td key={i} style={{ padding: '1.5rem 2rem' }}>
                <div style={{
                    height: '2rem', borderRadius: '6px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite'
                }} />
            </td>
        ))}
    </tr>
);

// Status badge style
const statusStyle = (status) => {
    const map = {
        present: { background: '#d1fae5', color: '#065f46' },
        late: { background: '#fef3c7', color: '#92400e' },
        leave: { background: '#dbeafe', color: '#1e40af' },
    };
    return {
        ...(map[status] || { background: '#f1f5f9', color: '#475569' }),
        padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
    };
};

function MarkAttendance() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    // Selected date — default today
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);

    // Existing attendance for selected date: { employee_id -> status }
    const [existingMap, setExistingMap] = useState({});
    const [attLoading, setAttLoading] = useState(false);

    const { user } = useAuth();
    const userRole = user?.role || 'employee';

    useEffect(() => {
        if (userRole !== 'admin' && userRole !== 'manager') {
            alert('Access Denied! Only Admin or Manager can mark attendance.');
            window.location.href = '/my-profile';
            return;
        }
        loadEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    // Reload existing attendance whenever date changes
    useEffect(() => {
        loadExistingAttendance(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        const filtered = employees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    const loadEmployees = async () => {
        try {
            const data = await api.getEmployees();
            setEmployees(data);
            setFilteredEmployees(data);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExistingAttendance = async (date) => {
        setAttLoading(true);
        try {
            const records = await api.getAttendanceByDate(date);
            const map = {};
            records.forEach(r => { map[r.employee_id] = r.status; });
            setExistingMap(map);
        } catch (e) {
            console.error('Error loading attendance:', e);
            setExistingMap({});
        } finally {
            setAttLoading(false);
        }
    };

    const markStatus = async (id, name, department, status) => {
        setSaving(prev => ({ ...prev, [id]: status }));
        try {
            const response = await api.markAttendance({ id, name, department, status, date: selectedDate });
            if (response.success) {
                setExistingMap(prev => ({ ...prev, [id]: status }));
            } else {
                alert('❌ Error: ' + (response.error || 'Unknown'));
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('❌ Error marking attendance');
        } finally {
            setSaving(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
    };

    const markAllPresent = async () => {
        const dateLabel = selectedDate === todayStr ? 'today' : selectedDate;
        if (!window.confirm(`Mark ALL employees as Present on ${dateLabel}?`)) return;
        try {
            await Promise.all(employees.map(emp =>
                api.markAttendance({ id: emp.id, name: emp.name, department: emp.department, status: 'present', date: selectedDate })
            ));
            const map = {};
            employees.forEach(emp => { map[emp.id] = 'present'; });
            setExistingMap(map);
            alert('✅ All employees marked as PRESENT!');
        } catch (error) {
            console.error('Error marking all present:', error);
            alert('❌ Error marking attendance');
        }
    };

    const isToday = selectedDate === todayStr;
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div>
            <Navigation />
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .att-btn { transition: transform 0.15s, opacity 0.15s; }
                .att-btn:hover { transform: scale(1.07); }
                .att-btn.active-status { box-shadow: 0 0 0 3px rgba(255,255,255,0.4); transform: scale(1.05); }
            `}</style>
            <div style={{ paddingTop: '6rem', paddingBottom: '5rem' }}>

                {/* Header */}
                <div className="container text-center" style={{ marginBottom: '2.5rem' }} data-aos="fade-up">
                    <h1 className="page-title">
                        {isToday ? "Mark Today's Attendance" : 'Update Attendance'}
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{displayDate}</p>
                    {!isToday && (
                        <span style={{ display: 'inline-block', marginTop: '0.5rem', background: '#fef3c7', color: '#92400e', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                            <i className="fas fa-history" style={{ marginRight: '6px' }}></i>Editing Past Date
                        </span>
                    )}
                </div>

                {/* Controls bar */}
                <div className="container" style={{ marginBottom: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }} data-aos="fade-up">
                        {/* Date picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                                <i className="fas fa-calendar-alt" style={{ marginRight: '6px', color: 'var(--primary-color)' }}></i>
                                Select Date:
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                style={{ maxWidth: '180px' }}
                                value={selectedDate}
                                max={todayStr}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>

                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="form-input"
                            style={{ flex: 1, maxWidth: '22rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <button onClick={markAllPresent} className="btn btn-success btn-lg">
                            <i className="fas fa-check-double"></i> Mark All Present
                        </button>
                    </div>
                </div>

                {/* Summary chips for selected date */}
                {!attLoading && Object.keys(existingMap).length > 0 && (
                    <div className="container" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Present', status: 'present', color: '#10b981', icon: 'fa-user-check' },
                                { label: 'Late', status: 'late', color: '#f59e0b', icon: 'fa-clock' },
                                { label: 'On Leave', status: 'leave', color: '#3b82f6', icon: 'fa-plane-departure' },
                            ].map(s => {
                                const count = Object.values(existingMap).filter(v => v === s.status).length;
                                return (
                                    <div key={s.status} style={{ background: 'rgba(30,41,59,0.5)', border: `1px solid ${s.color}40`, borderRadius: '10px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className={`fas ${s.icon}`} style={{ color: s.color }}></i>
                                        <span style={{ color: s.color, fontWeight: 700 }}>{count}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{s.label}</span>
                                    </div>
                                );
                            })}
                            <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-user-slash" style={{ color: '#94a3b8' }}></i>
                                <span style={{ color: '#94a3b8', fontWeight: 700 }}>{employees.length - Object.keys(existingMap).length}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Not Marked</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="container">
                    <div className="glass" style={{ overflow: 'hidden' }} data-aos="fade-up">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Employee</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Department</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Current Status</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--success-color)' }}>Present</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--warning-color)' }}>Late</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--primary-color)' }}>On Leave</th>
                                    </tr>
                                </thead>
                                <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                                                <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                                <p>No employees found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => {
                                            const currentStatus = existingMap[emp.id];
                                            const isSaving = saving[emp.id];
                                            return (
                                                <tr key={emp.id} style={{ transition: 'all 0.3s ease', borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'var(--success-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                                                                {emp.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{emp.name}</p>
                                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{emp.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.department || 'N/A'}</td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                        {attLoading ? (
                                                            <div style={{ height: '1.5rem', width: '80px', margin: '0 auto', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
                                                        ) : currentStatus ? (
                                                            <span style={statusStyle(currentStatus)}>
                                                                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                        <button
                                                            disabled={!!isSaving}
                                                            onClick={() => markStatus(emp.id, emp.name, emp.department, 'present')}
                                                            className={`btn btn-success att-btn ${currentStatus === 'present' ? 'active-status' : ''}`}
                                                            style={{ opacity: isSaving && isSaving !== 'present' ? 0.5 : 1 }}
                                                        >
                                                            {isSaving === 'present' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                                                            {' '}Present
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                        <button
                                                            disabled={!!isSaving}
                                                            onClick={() => markStatus(emp.id, emp.name, emp.department, 'late')}
                                                            className={`btn att-btn ${currentStatus === 'late' ? 'active-status' : ''}`}
                                                            style={{ background: 'var(--warning-gradient)', color: 'white', opacity: isSaving && isSaving !== 'late' ? 0.5 : 1 }}
                                                        >
                                                            {isSaving === 'late' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-clock"></i>}
                                                            {' '}Late
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                        <button
                                                            disabled={!!isSaving}
                                                            onClick={() => markStatus(emp.id, emp.name, emp.department, 'leave')}
                                                            className={`btn att-btn ${currentStatus === 'leave' ? 'active-status' : ''}`}
                                                            style={{ background: 'var(--primary-gradient)', color: 'white', opacity: isSaving && isSaving !== 'leave' ? 0.5 : 1 }}
                                                        >
                                                            {isSaving === 'leave' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plane-departure"></i>}
                                                            {' '}On Leave
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default MarkAttendance;
