import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SkeletonBox = ({ h = '80px' }) => (
    <div style={{
        height: h, borderRadius: '8px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite'
    }} />
);

const SkeletonRow = ({ cols = 6 }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} style={{ padding: '1.5rem 2rem' }}>
                <div style={{
                    height: '1.5rem', borderRadius: '6px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite'
                }} />
            </td>
        ))}
    </tr>
);

const statusBadgeStyle = { present: { bg: '#d1fae5', color: '#065f46' }, late: { bg: '#fef3c7', color: '#92400e' }, leave: { bg: '#dbeafe', color: '#1e40af' } };

const Attendance = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // View tab state
    const [activeTab, setActiveTab] = useState('view');
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('today');
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [viewSearch, setViewSearch] = useState('');
    const [stats, setStats] = useState({ present: 0, late: 0, leave: 0 });

    // Mark tab state
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [markDate, setMarkDate] = useState(todayStr);
    const [markExistingMap, setMarkExistingMap] = useState({});
    const [markAttLoading, setMarkAttLoading] = useState(false);
    const [saving, setSaving] = useState({});

    const { user } = useAuth();
    const userRole = user?.role || 'employee';
    const isAdmin = userRole === 'admin' || userRole === 'manager';

    useEffect(() => {
        if (activeTab === 'view') loadAttendance();
        else if (activeTab === 'mark' && isAdmin) loadEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, viewMode, selectedDate, selectedMonth]);

    useEffect(() => {
        if (activeTab === 'mark' && isAdmin) loadMarkExisting(markDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markDate, activeTab]);

    useEffect(() => {
        const filtered = employees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            let data = [];
            if (viewMode === 'today') data = await api.getTodayAttendance();
            else if (viewMode === 'date') data = await api.getAttendanceByDate(selectedDate);
            else if (viewMode === 'month') {
                const [year, month] = selectedMonth.split('-');
                data = await api.getAttendanceByMonth(year, month);
            }
            setAttendanceData(data);
            setStats({
                present: data.filter(e => e.status === 'present').length,
                late: data.filter(e => e.status === 'late').length,
                leave: data.filter(e => e.status === 'leave').length
            });
        } catch (error) {
            console.error('Error loading attendance:', error);
            setAttendanceData([]);
            setStats({ present: 0, late: 0, leave: 0 });
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const data = await api.getEmployees();
            setEmployees(data);
            setFilteredEmployees(data);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const loadMarkExisting = async (date) => {
        setMarkAttLoading(true);
        try {
            const records = await api.getAttendanceByDate(date);
            const map = {};
            records.forEach(r => { map[r.employee_id] = r.status; });
            setMarkExistingMap(map);
        } catch (e) {
            setMarkExistingMap({});
        } finally {
            setMarkAttLoading(false);
        }
    };

    const markStatus = async (id, name, department, status) => {
        setSaving(prev => ({ ...prev, [id]: status }));
        try {
            const response = await api.markAttendance({ id, name, department, status, date: markDate });
            if (response.success) {
                setMarkExistingMap(prev => ({ ...prev, [id]: status }));
            } else {
                alert('❌ Error: ' + (response.error || 'Unknown'));
            }
        } catch (error) {
            alert('❌ Error marking attendance');
        } finally {
            setSaving(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
    };

    const markAllPresent = async () => {
        const label = markDate === todayStr ? 'today' : markDate;
        if (!window.confirm(`Mark ALL employees as Present on ${label}?`)) return;
        try {
            await Promise.all(employees.map(emp =>
                api.markAttendance({ id: emp.id, name: emp.name, department: emp.department, status: 'present', date: markDate })
            ));
            const map = {};
            employees.forEach(emp => { map[emp.id] = 'present'; });
            setMarkExistingMap(map);
            alert('✅ All employees marked as PRESENT!');
        } catch (error) {
            alert('❌ Error marking attendance');
        }
    };

    const getStatusBadge = (status) => {
        const map = { present: 'status-success', late: 'status-warning', absent: 'status-error', leave: 'status-info' };
        return `status-badge ${map[status] || 'status-info'}`;
    };

    const todayDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const filteredAttendance = viewSearch
        ? attendanceData.filter(e =>
            (e.name || '').toLowerCase().includes(viewSearch.toLowerCase()) ||
            (e.employee_id || '').toLowerCase().includes(viewSearch.toLowerCase())
        )
        : attendanceData;

    const colCount = viewMode === 'month' ? 7 : 6;

    return (
        <div>
            <Navigation />
            <style>{`
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}</style>
            <div style={{ paddingTop: '6rem', paddingBottom: '5rem' }}>

                <div className="container text-center" style={{ marginBottom: '2rem' }} data-aos="fade-up">
                    <h1 className="page-title">Attendance Management</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>{todayDate}</p>
                </div>

                {/* Tab switcher */}
                <div className="container" style={{ marginBottom: '2rem' }}>
                    <div className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }} data-aos="fade-up">
                        <button onClick={() => setActiveTab('view')} className={`btn ${activeTab === 'view' ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: '10rem' }}>
                            <i className="fas fa-list"></i> View Attendance
                        </button>
                        {isAdmin && (
                            <button onClick={() => setActiveTab('mark')} className={`btn ${activeTab === 'mark' ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: '10rem' }}>
                                <i className="fas fa-check-circle"></i> Mark Attendance
                            </button>
                        )}
                    </div>
                </div>

                {/* ===== VIEW TAB ===== */}
                {activeTab === 'view' && (
                    <>
                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }} data-aos="fade-up">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                                    <button onClick={() => setViewMode('today')} className={`btn ${viewMode === 'today' ? 'btn-primary' : 'btn-secondary'}`}>
                                        <i className="fas fa-calendar-day"></i> Today
                                    </button>
                                    <button onClick={() => setViewMode('date')} className={`btn ${viewMode === 'date' ? 'btn-primary' : 'btn-secondary'}`}>
                                        <i className="fas fa-calendar-alt"></i> Specific Date
                                    </button>
                                    <button onClick={() => setViewMode('month')} className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}>
                                        <i className="fas fa-calendar"></i> Monthly View
                                    </button>
                                    {viewMode === 'date' && (
                                        <input type="date" className="form-input" style={{ maxWidth: '200px' }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                    )}
                                    {viewMode === 'month' && (
                                        <input type="month" className="form-input" style={{ maxWidth: '200px' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }} data-aos="fade-up">
                                <input type="text" placeholder="Search by name or ID..." className="form-input" style={{ width: '100%' }} value={viewSearch} onChange={(e) => setViewSearch(e.target.value)} />
                            </div>
                        </div>

                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '1.5rem' }}>
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="glass card" style={{ padding: '1.5rem' }}><SkeletonBox h="100px" /></div>)
                                ) : (
                                    <>
                                        <div className="glass card text-center" style={{ padding: '1.5rem' }}>
                                            <i className="fas fa-user-check" style={{ fontSize: '2.5rem', color: 'var(--success-color)', marginBottom: '1rem' }}></i>
                                            <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--success-color)' }}>{stats.present}</h3>
                                            <p style={{ color: 'var(--text-secondary)' }}>Present</p>
                                        </div>
                                        <div className="glass card text-center" style={{ padding: '1.5rem' }}>
                                            <i className="fas fa-clock" style={{ fontSize: '2.5rem', color: 'var(--warning-color)', marginBottom: '1rem' }}></i>
                                            <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--warning-color)' }}>{stats.late}</h3>
                                            <p style={{ color: 'var(--text-secondary)' }}>Late</p>
                                        </div>
                                        <div className="glass card text-center" style={{ padding: '1.5rem' }}>
                                            <i className="fas fa-plane-departure" style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginBottom: '1rem' }}></i>
                                            <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--primary-color)' }}>{stats.leave}</h3>
                                            <p style={{ color: 'var(--text-secondary)' }}>On Leave</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="container">
                            <div className="glass" style={{ overflow: 'hidden' }} data-aos="fade-up">
                                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>Attendance Records</h2>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        {viewSearch ? `${filteredAttendance.length} of ${attendanceData.length} records` : `${attendanceData.length} records`}
                                    </span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%' }}>
                                        <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                            <tr>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Employee</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Department</th>
                                                {viewMode === 'month' && <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Date</th>}
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Clock In</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Clock Out</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' }}>Status</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' }}>Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                                            {loading ? (
                                                [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} cols={colCount} />)
                                            ) : filteredAttendance.length > 0 ? (
                                                filteredAttendance.map((emp) => (
                                                    <tr key={`${emp.employee_id}-${emp.attendance_date}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '1.5rem 2rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--success-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                                                                    {emp.name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{emp.employee_id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1.5rem 2rem', color: 'var(--text-secondary)' }}>{emp.department || 'N/A'}</td>
                                                        {viewMode === 'month' && (
                                                            <td style={{ padding: '1.5rem 2rem', color: 'var(--text-secondary)' }}>
                                                                {new Date(emp.attendance_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                            </td>
                                                        )}
                                                        <td style={{ padding: '1.5rem 2rem', fontWeight: '500', color: 'var(--success-color)' }}>{emp.clock_in || '-'}</td>
                                                        <td style={{ padding: '1.5rem 2rem', fontWeight: '500', color: 'var(--primary-color)' }}>{emp.clock_out || '-'}</td>
                                                        <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                                                            <span className={getStatusBadge(emp.status)}>
                                                                {emp.status === 'leave' ? 'On Leave' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1.5rem 2rem', textAlign: 'center', fontWeight: '600', color: 'var(--primary-color)' }}>{emp.hours || '—'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                                                        <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                                        <p>{viewSearch ? 'No records match your search.' : 'No attendance records found.'}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== MARK TAB ===== */}
                {activeTab === 'mark' && isAdmin && (
                    <>
                        {/* Controls: date picker + search + mark all */}
                        <div className="container" style={{ marginBottom: '2rem' }}>
                            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }} data-aos="fade-up">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <label style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                                        <i className="fas fa-calendar-alt" style={{ marginRight: '6px', color: 'var(--primary-color)' }}></i>
                                        Select Date:
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        style={{ maxWidth: '180px' }}
                                        value={markDate}
                                        max={todayStr}
                                        onChange={(e) => setMarkDate(e.target.value)}
                                    />
                                    {markDate !== todayStr && (
                                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                            <i className="fas fa-history" style={{ marginRight: '4px' }}></i>Past Date
                                        </span>
                                    )}
                                </div>
                                <input type="text" placeholder="Search by name or ID..." className="form-input" style={{ flex: 1, maxWidth: '22rem' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <button onClick={markAllPresent} className="btn btn-success btn-lg">
                                    <i className="fas fa-check-double"></i> Mark All Present
                                </button>
                            </div>
                        </div>

                        {/* Summary chips */}
                        {!markAttLoading && Object.keys(markExistingMap).length > 0 && (
                            <div className="container" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Present', status: 'present', color: '#10b981', icon: 'fa-user-check' },
                                        { label: 'Late', status: 'late', color: '#f59e0b', icon: 'fa-clock' },
                                        { label: 'On Leave', status: 'leave', color: '#3b82f6', icon: 'fa-plane-departure' },
                                    ].map(s => {
                                        const count = Object.values(markExistingMap).filter(v => v === s.status).length;
                                        return (
                                            <div key={s.status} style={{ background: 'rgba(30,41,59,0.5)', border: `1px solid ${s.color}40`, borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className={`fas ${s.icon}`} style={{ color: s.color }}></i>
                                                <span style={{ color: s.color, fontWeight: 700 }}>{count}</span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{s.label}</span>
                                            </div>
                                        );
                                    })}
                                    <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-user-slash" style={{ color: '#94a3b8' }}></i>
                                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>{employees.length - Object.keys(markExistingMap).length}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Not Marked</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mark table */}
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
                                            {loadingEmployees ? (
                                                [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} cols={6} />)
                                            ) : filteredEmployees.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                                                        <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                                        <p>No employees found</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredEmployees.map((emp) => {
                                                    const cur = markExistingMap[emp.id];
                                                    const isSaving = saving[emp.id];
                                                    const s = statusBadgeStyle[cur] || {};
                                                    return (
                                                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'var(--success-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                                                                        {emp.name.split(' ').map(n => n[0]).join('')}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{emp.id}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.department || 'N/A'}</td>
                                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                                {markAttLoading ? (
                                                                    <div style={{ height: '1.5rem', width: '80px', margin: '0 auto', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
                                                                ) : cur ? (
                                                                    <span style={{ background: s.bg, color: s.color, padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                                                                        {cur === 'leave' ? 'On Leave' : cur.charAt(0).toUpperCase() + cur.slice(1)}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>—</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                                <button disabled={!!isSaving} onClick={() => markStatus(emp.id, emp.name, emp.department, 'present')}
                                                                    className="btn btn-success"
                                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', boxShadow: cur === 'present' ? '0 0 0 3px rgba(16,185,129,0.4)' : 'none', opacity: isSaving && isSaving !== 'present' ? 0.5 : 1 }}>
                                                                    {isSaving === 'present' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} Present
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                                <button disabled={!!isSaving} onClick={() => markStatus(emp.id, emp.name, emp.department, 'late')}
                                                                    className="btn"
                                                                    style={{ background: 'var(--warning-gradient)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', boxShadow: cur === 'late' ? '0 0 0 3px rgba(245,158,11,0.4)' : 'none', opacity: isSaving && isSaving !== 'late' ? 0.5 : 1 }}>
                                                                    {isSaving === 'late' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-clock"></i>} Late
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                                <button disabled={!!isSaving} onClick={() => markStatus(emp.id, emp.name, emp.department, 'leave')}
                                                                    className="btn"
                                                                    style={{ background: 'var(--primary-gradient)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', boxShadow: cur === 'leave' ? '0 0 0 3px rgba(59,130,246,0.4)' : 'none', opacity: isSaving && isSaving !== 'leave' ? 0.5 : 1 }}>
                                                                    {isSaving === 'leave' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plane-departure"></i>} On Leave
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
                    </>
                )}

            </div>
        </div>
    );
};

export default Attendance;
