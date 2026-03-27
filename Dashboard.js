import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, RadialLinearScale } from 'chart.js';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import api from '../services/api';
import Navigation from './Navigation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, RadialLinearScale);

const Skeleton = ({ h = '300px' }) => (
    <div style={{
        height: h, borderRadius: '8px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite'
    }} />
);

const Dashboard = () => {
    const [initialLoading, setInitialLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0, totalPayroll: '₹0', pendingPayments: 0,
        attendanceRate: '0%', presentToday: 0, lateToday: 0, onLeaveToday: 0,
        presentPercentage: 0, latePercentage: 0, onLeavePercentage: 0
    });
    const [latestEmployees, setLatestEmployees] = useState([]);
    const [lastUpdateTime, setLastUpdateTime] = useState('Click Refresh to load data');
    const [isUpdating, setIsUpdating] = useState(false);
    const [attendanceChartData, setAttendanceChartData] = useState(null);
    const [departmentChartData, setDepartmentChartData] = useState(null);
    const [payrollChartData, setPayrollChartData] = useState(null);
    const [performanceChartData, setPerformanceChartData] = useState(null);

    useEffect(() => {
        updateDashboard().finally(() => setInitialLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateDashboard = async () => {
        setIsUpdating(true);
        try {
            const now = new Date();
            // All 4 calls in parallel — single employees fetch shared
            const [employeesData, todayAttendance, weeklyData, monthAtt] = await Promise.all([
                api.getEmployees(),
                api.getTodayAttendance(),
                api.getWeeklyAttendance(),
                api.getAttendanceByMonth(now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'))
            ]);

            // ---- Stats ----
            const totalSalary = employeesData.reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0);
            const pending = employeesData.filter(e => !e.payroll_status || e.payroll_status === 'pending').length;
            const presentCount = todayAttendance.filter(a => a.status === 'present').length;
            const lateCount = todayAttendance.filter(a => a.status === 'late').length;
            const leaveCount = todayAttendance.filter(a => a.status === 'leave').length;
            const totalMarked = presentCount + lateCount + leaveCount;
            const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : 0;
            setStats({
                totalEmployees: employeesData.length,
                totalPayroll: '₹' + totalSalary.toLocaleString('en-IN'),
                pendingPayments: pending,
                attendanceRate: attendanceRate + '%',
                presentToday: presentCount, lateToday: lateCount, onLeaveToday: leaveCount,
                presentPercentage: totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0,
                latePercentage: totalMarked > 0 ? Math.round((lateCount / totalMarked) * 100) : 0,
                onLeavePercentage: totalMarked > 0 ? Math.round((leaveCount / totalMarked) * 100) : 0
            });
            setLatestEmployees(employeesData.slice(-3).reverse());

            // ---- Charts from employees ----
            const paid = employeesData.filter(e => e.payroll_status === 'paid').length;
            const processing = employeesData.filter(e => e.payroll_status === 'processing').length;
            const deptCounts = {};
            employeesData.forEach(emp => {
                const dept = emp.department || 'Unassigned';
                deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            });
            setDepartmentChartData({
                labels: Object.keys(deptCounts),
                datasets: [{ data: Object.values(deptCounts), backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'], borderWidth: 2, borderColor: '#1e293b' }]
            });
            setPayrollChartData({
                labels: ['Paid', 'Pending', 'Processing'],
                datasets: [{ label: 'Employees', data: [paid, pending, processing], backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(14,165,233,0.8)'], borderColor: ['#10b981', '#f59e0b', '#0ea5e9'], borderWidth: 2 }]
            });

            // ---- Weekly chart ----
            if (weeklyData && weeklyData.length > 0) {
                setAttendanceChartData({
                    labels: weeklyData.map(d => d.day),
                    datasets: [
                        { label: 'Present', data: weeklyData.map(d => d.present), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true },
                        { label: 'Late', data: weeklyData.map(d => d.late), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: true },
                        { label: 'On Leave', data: weeklyData.map(d => d.leave || 0), borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.1)', tension: 0.4, fill: true }
                    ]
                });
            }

            // ---- Monthly performance radar ----
            const total = monthAtt.length || 1;
            const mPresent = monthAtt.filter(r => r.status === 'present').length;
            const mLate = monthAtt.filter(r => r.status === 'late').length;
            const mLeave = monthAtt.filter(r => r.status === 'leave').length;
            setPerformanceChartData({
                labels: ['Attendance Rate', 'Punctuality', 'Present %', 'Late %', 'On Leave %'],
                datasets: [{ label: 'This Month', data: [Math.round(((mPresent + mLate) / total) * 100), Math.round((mPresent / total) * 100), Math.round((mPresent / total) * 100), Math.round((mLate / total) * 100), Math.round((mLeave / total) * 100)], borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.2)', pointBackgroundColor: '#0ea5e9' }]
            });

            setLastUpdateTime(`Updated: ${new Date().toLocaleTimeString()}`);
        } catch (e) {
            console.error('Dashboard refresh error:', e);
        } finally {
            setIsUpdating(false);
        }
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: { legend: { position: 'top', labels: { color: '#cbd5e1' } } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
            x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
        }
    };

    const radarOptions = {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: { legend: { position: 'top', labels: { color: '#cbd5e1' } } },
        scales: { r: { beginAtZero: true, max: 100, grid: { color: '#334155' }, pointLabels: { color: '#94a3b8' }, ticks: { color: '#94a3b8', backdropColor: 'transparent' } } }
    };

    const ChartBox = ({ title, children, loading }) => (
        <div className="glass" style={{ padding: '2rem', position: 'relative' }} data-aos="fade-up">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {title}
                {isUpdating && <i className="fas fa-sync-alt fa-spin" style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}></i>}
            </h3>
            <div style={{ height: '300px' }}>
                {loading ? <Skeleton h="260px" /> : children}
            </div>
        </div>
    );

    return (
        <div>
            <Navigation />
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
            <div style={{ paddingTop: '6rem', paddingBottom: '5rem' }}>
                <div className="container text-center" style={{ marginBottom: '4rem' }} data-aos="fade-up">
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>Manage your organization efficiently</p>
                </div>

                {/* Stat Cards */}
                <div className="container" style={{ marginBottom: '4rem' }}>
                    <div className="grid-auto">
                        {initialLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="glass card" style={{ padding: '1.5rem' }}>
                                    <Skeleton h="100px" />
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="glass card text-center" style={{ padding: '1.5rem', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden' }} data-aos="fade-up" data-aos-delay="100">
                                    <i className="fas fa-users" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.9 }}></i>
                                    <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{stats.totalEmployees}</h3>
                                    <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Total Employees</p>
                                    {isUpdating && <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem' }}><i className="fas fa-sync-alt fa-spin"></i></div>}
                                </div>
                                <div className="glass card text-center" style={{ padding: '1.5rem', background: 'var(--success-gradient)', color: 'white', position: 'relative', overflow: 'hidden' }} data-aos="fade-up" data-aos-delay="200">
                                    <i className="fas fa-user-check" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.9 }}></i>
                                    <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{stats.presentToday}</h3>
                                    <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Present Today ({stats.presentPercentage}%)</p>
                                    {isUpdating && <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem' }}><i className="fas fa-sync-alt fa-spin"></i></div>}
                                </div>
                                <div className="glass card text-center" style={{ padding: '1.5rem', background: 'var(--warning-gradient)', color: 'white', position: 'relative', overflow: 'hidden' }} data-aos="fade-up" data-aos-delay="300">
                                    <i className="fas fa-clock" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.9 }}></i>
                                    <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{stats.lateToday}</h3>
                                    <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Late Today ({stats.latePercentage}%)</p>
                                    {isUpdating && <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem' }}><i className="fas fa-sync-alt fa-spin"></i></div>}
                                </div>
                                <div className="glass card text-center" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white', position: 'relative', overflow: 'hidden' }} data-aos="fade-up" data-aos-delay="400">
                                    <i className="fas fa-plane-departure" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.9 }}></i>
                                    <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{stats.onLeaveToday}</h3>
                                    <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>On Leave Today ({stats.onLeavePercentage}%)</p>
                                    {isUpdating && <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem' }}><i className="fas fa-sync-alt fa-spin"></i></div>}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="container" style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '1.5rem' }}>
                        {initialLoading ? [1, 2, 3].map(i => <div key={i} className="glass card" style={{ padding: '1.5rem' }}><Skeleton h="80px" /></div>) : (
                            <>
                                <div className="glass card text-center" style={{ padding: '1.5rem' }} data-aos="fade-up" data-aos-delay="100">
                                    <i className="fas fa-money-bill-wave" style={{ fontSize: '2rem', color: 'var(--success-color)', marginBottom: '0.75rem' }}></i>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.totalPayroll}</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>Monthly Payroll</p>
                                </div>
                                <div className="glass card text-center" style={{ padding: '1.5rem' }} data-aos="fade-up" data-aos-delay="200">
                                    <i className="fas fa-hourglass-half" style={{ fontSize: '2rem', color: 'var(--warning-color)', marginBottom: '0.75rem' }}></i>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.pendingPayments}</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>Pending Payments</p>
                                </div>
                                <div className="glass card text-center" style={{ padding: '1.5rem' }} data-aos="fade-up" data-aos-delay="300">
                                    <i className="fas fa-chart-line" style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '0.75rem' }}></i>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.attendanceRate}</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>Attendance Rate</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Charts */}
                <div className="container" style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem' }} data-aos="fade-up">
                        <i className="fas fa-chart-line" style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}></i>
                        Live Analytics Dashboard
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(25rem, 1fr))', gap: '2rem' }}>
                        <ChartBox title="Weekly Attendance Trend" loading={!attendanceChartData}>
                            {attendanceChartData && <Line data={attendanceChartData} options={chartOptions} />}
                        </ChartBox>
                        <ChartBox title="Department Distribution" loading={!departmentChartData}>
                            {departmentChartData && <Doughnut data={departmentChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } } } }} />}
                        </ChartBox>
                        <ChartBox title="Payroll Status" loading={!payrollChartData}>
                            {payrollChartData && <Bar data={payrollChartData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />}
                        </ChartBox>
                        <ChartBox title="Monthly Performance" loading={!performanceChartData}>
                            {performanceChartData && <Radar data={performanceChartData} options={radarOptions} />}
                        </ChartBox>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <i className={`fas fa-sync-alt ${isUpdating ? 'fa-spin' : ''}`} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>
                            {lastUpdateTime}
                        </span>
                        <button onClick={() => updateDashboard()} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem' }} disabled={isUpdating}>
                            <i className="fas fa-sync-alt"></i> {isUpdating ? 'Refreshing...' : 'Refresh Dashboard'}
                        </button>
                    </div>
                </div>

                {/* Recent Employees */}
                <div className="container">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem' }} data-aos="fade-up">Recent Employees</h2>
                    <div className="glass" style={{ padding: '2rem' }}>
                        <div className="grid-auto">
                            {initialLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="glass card" style={{ padding: '1.5rem' }}><Skeleton h="80px" /></div>)
                            ) : latestEmployees.length > 0 ? (
                                latestEmployees.map((emp, index) => {
                                    const initials = emp.name.split(' ').map(n => n[0].toUpperCase()).join('');
                                    return (
                                        <div key={emp.id} className="glass card" style={{ padding: '1.5rem', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)' }} data-aos="fade-up" data-aos-delay={(index + 1) * 100}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '3.75rem', height: '3.75rem', borderRadius: '0.9375rem', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.2rem' }}>{initials}</div>
                                                <div>
                                                    <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</h4>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{emp.department || 'N/A'}</p>
                                                    <p style={{ color: 'var(--primary-color)', fontWeight: '600' }}>₹{parseFloat(emp.salary || 0).toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-light)', gridColumn: '1 / -1' }}>
                                    <p>No employees found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;