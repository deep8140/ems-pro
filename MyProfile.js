import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navigation from './Navigation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function MyProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '', id: '', role: '', department: '',
        email: '', phone: '', join_date: '', salary: 0, payroll_status: ''
    });
    const [avatar, setAvatar] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    // Attendance state
    const [attTab, setAttTab] = useState('monthly');
    const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
    const [monthVal, setMonthVal] = useState(new Date().toISOString().slice(0, 7));
    const [attRecords, setAttRecords] = useState([]);
    const [attLoading, setAttLoading] = useState(false);
    const [attStats, setAttStats] = useState({ present: 0, leave: 0, late: 0, total: 0 });

    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const fallbackAvatar = user
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0ea5e9&color=fff&size=256&bold=true`
        : null;

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        setProfileData({
            name: user.name || '',
            id: user.id || '',
            role: user.role || 'employee',
            department: user.department || '',
            email: user.email || '',
            phone: user.phone || '',
            join_date: user.join_date || '',
            salary: user.salary || 0,
            payroll_status: user.payroll_status || ''
        });
        setAvatar(user.photo_url || null);
    }, [user, navigate]);

    // Load attendance whenever tab/date/month changes
    useEffect(() => {
        if (!user) return;
        loadAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attTab, dailyDate, monthVal, user]);

    const loadAttendance = async () => {
        setAttLoading(true);
        try {
            let data = [];
            if (attTab === 'daily') {
                data = await api.getAttendanceByDate(dailyDate);
            } else {
                const [year, month] = monthVal.split('-');
                data = await api.getAttendanceByMonth(year, month);
            }
            const mine = data.filter(r => r.employee_id === user.id);
            setAttRecords(mine);
            setAttStats({
                present: mine.filter(r => r.status === 'present').length,
                late: mine.filter(r => r.status === 'late').length,
                leave: mine.filter(r => r.status === 'leave').length,
                total: mine.length
            });
        } catch (e) {
            console.error(e);
            setAttRecords([]);
        } finally {
            setAttLoading(false);
        }
    };

    // Compress image to max 400x400 JPEG 0.7 before upload
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 400;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                    else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoChange = async (e) => {
        if (!e.target.files || !e.target.files[0]) return;
        setPhotoUploading(true);
        try {
            const compressed = await compressImage(e.target.files[0]);
            setAvatar(compressed);
            const result = await api.updatePhoto(profileData.id, compressed);
            if (result.success) {
                updateUser({ photo_url: compressed });
            } else {
                alert('❌ Photo upload failed: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            alert('⚠️ Could not upload photo.');
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const saveProfile = async () => {
        try {
            const result = await api.updateEmployee(profileData.id, {
                name: profileData.name,
                department: profileData.department,
                email: profileData.email,
                phone: profileData.phone,
                salary: profileData.salary,
                join_date: profileData.join_date,
                role: profileData.role
            });
            if (result.success) {
                updateUser({ ...profileData });
                alert('✅ Profile updated successfully!');
                setIsEditing(false);
            } else {
                alert('❌ Failed to update profile: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('⚠️ Could not connect to server.');
            setIsEditing(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN');
    };

    const statusStyle = (status) => {
        const map = {
            present: { background: '#d1fae5', color: '#065f46' },
            late: { background: '#fef3c7', color: '#92400e' },
            absent: { background: '#fee2e2', color: '#991b1b' },
            leave: { background: '#dbeafe', color: '#1e40af' },
        };
        return {
            ...(map[status] || { background: '#f1f5f9', color: '#475569' }),
            padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
        };
    };

    const roleDisplay = profileData.role
        ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)
        : 'Employee';

    // Payroll badge
    const payroll = profileData.payroll_status;
    const payrollBadge = payroll === 'paid'
        ? { bg: '#d1fae5', color: '#065f46', icon: 'fa-check-circle', label: 'Paid' }
        : payroll === 'processing'
            ? { bg: '#dbeafe', color: '#1e40af', icon: 'fa-spinner', label: 'Processing' }
            : { bg: '#fef3c7', color: '#92400e', icon: 'fa-clock', label: 'Pending' };

    const infoCard = (icon, label, content) => (
        <div style={{ background: 'rgba(30,41,59,0.5)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <i className={icon}></i> {label}
            </div>
            {content}
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
                .att-skeleton {
                    height: 1.5rem; border-radius: 6px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%);
                    background-size: 200% 100%; animation: shimmer 1.4s infinite;
                }
                .photo-overlay { opacity: 0; transition: opacity 0.3s ease; }
                .photo-wrap:hover .photo-overlay { opacity: 1; }
            `}</style>
            <div style={{ paddingTop: '8rem', padding: '8rem 1rem 5rem', maxWidth: '80rem', margin: '0 auto' }}>

                {/* ===== PROFILE CARD ===== */}
                <div className="glass" data-aos="zoom-in" data-aos-duration="1200">
                    <div style={{ background: 'var(--primary-gradient)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '3.75rem 2.5rem 2.5rem', textAlign: 'center', position: 'relative' }}>
                        <div className="photo-wrap" style={{ position: 'relative', display: 'inline-block', marginBottom: '-5rem' }}>
                            <img
                                src={avatar || fallbackAvatar}
                                alt="Profile"
                                style={{ width: '11.25rem', height: '11.25rem', borderRadius: '50%', border: '0.5rem solid var(--bg-primary)', objectFit: 'cover', boxShadow: 'var(--shadow-2xl)' }}
                            />
                            <label htmlFor="photoUpload" className="photo-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer' }}>
                                {photoUploading
                                    ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
                                    : <>
                                        <i className="fas fa-camera" style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}></i>
                                        <span style={{ fontSize: '1rem' }}>Change Photo</span>
                                    </>
                                }
                            </label>
                            <input type="file" id="photoUpload" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} disabled={photoUploading} />
                        </div>
                        {
                            isEditing
                                ? <input
                                    type="text"
                                    name="name"
                                    value={profileData.name}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Full Name"
                                    style={{ marginTop: '2rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', maxWidth: '24rem', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '12px' }}
                                />
                                : <h2 style={{ fontSize: '3.125rem', fontWeight: '800', color: 'white', marginTop: '2rem' }}>{profileData.name}</h2>
                        }
                        <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.75rem' }}>{roleDisplay}</p>
                        <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>ID: {profileData.id}</p>
                    </div>

                    <div style={{ padding: '6.25rem 3.125rem 3.75rem', background: 'rgba(30,41,59,0.3)', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(17.5rem, 1fr))', gap: '1.875rem', marginTop: '1.25rem' }}>

                            {infoCard('fas fa-building', 'Department',
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>{profileData.department || 'N/A'}</div>
                            )}

                            {infoCard('fas fa-envelope', 'Email',
                                isEditing
                                    ? <input type="email" name="email" value={profileData.email} onChange={handleInputChange} className="form-input" placeholder="your@email.com" />
                                    : <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>{profileData.email || 'N/A'}</div>
                            )}

                            {infoCard('fas fa-phone', 'Phone',
                                isEditing
                                    ? <input type="tel" name="phone" value={profileData.phone} onChange={handleInputChange} className="form-input" placeholder="+91 ___________" maxLength={10} />
                                    : <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>{profileData.phone || 'N/A'}</div>
                            )}

                            {infoCard('fas fa-calendar-alt', 'Joined Date',
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>{formatDate(profileData.join_date)}</div>
                            )}

                            {infoCard('fas fa-money-bill-wave', 'Monthly Salary',
                                <div style={{ color: 'var(--success-color)', fontWeight: '700', fontSize: '1.5rem' }}>
                                    ₹{parseFloat(profileData.salary || 0).toLocaleString('en-IN')}
                                </div>
                            )}

                            {infoCard('fas fa-receipt', 'Payroll Status',
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <span style={{ background: payrollBadge.bg, color: payrollBadge.color, padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className={`fas ${payrollBadge.icon}`}></i>
                                        {payrollBadge.label}
                                    </span>
                                </div>
                            )}

                            {infoCard('fas fa-user-tag', 'Role',
                                <div style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '1.25rem' }}>{roleDisplay}</div>
                            )}

                        </div>

                        <div style={{ marginTop: '3.125rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            {isEditing ? (
                                <>
                                    <button onClick={saveProfile} className="btn btn-lg" style={{ background: 'var(--success-gradient)' }}>
                                        <i className="fas fa-save"></i> Save Changes
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="btn btn-lg btn-secondary">
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn btn-lg" style={{ background: 'var(--primary-gradient)' }}>
                                    <i className="fas fa-edit"></i> Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== SALARY BREAKDOWN SECTION ===== */}
                {(() => {
                    const basic = parseFloat(profileData.salary || 0);

                    // Earnings
                    const hra = Math.round(basic * 0.20);   // HRA 20%
                    const ta = Math.round(basic * 0.05);   // TA 5%
                    const medical = Math.round(basic * 0.05);   // Medical 5%
                    const gross = basic + hra + ta + medical;

                    // Deductions
                    const pf = Math.round(basic * 0.12);   // PF 12% of basic
                    const tax = Math.round(basic * 0.05);   // Tax 5% of basic

                    // Attendance-based deductions (from current month attStats)
                    const leaveDays = attStats.leave;
                    const lateDays = attStats.late;
                    const perDay = Math.round(basic / 26);     // 26 working days
                    const leaveDeduct = leaveDays * perDay;
                    const lateDeduct = Math.round((lateDays * perDay) / 2); // half day per late

                    const totalDeductions = pf + tax + leaveDeduct + lateDeduct;
                    const netPay = gross - totalDeductions;

                    // Payroll status theme
                    const ps = profileData.payroll_status;
                    const theme = ps === 'paid'
                        ? { accent: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', icon: 'fa-check-circle', label: 'Salary Credited', sublabel: 'Payment received this month', netIcon: 'fa-hand-holding-usd', cardBg: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,95,70,0.12))' }
                        : ps === 'processing'
                            ? { accent: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.35)', icon: 'fa-spinner fa-spin', label: 'Processing', sublabel: 'Payment is being processed', netIcon: 'fa-clock', cardBg: 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(30,64,175,0.12))' }
                            : { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', icon: 'fa-hourglass-half', label: 'Payment Pending', sublabel: 'Salary not yet released', netIcon: 'fa-lock', cardBg: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(120,53,15,0.12))' };

                    const row = (icon, label, amount, color, sign, sub) => (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30,41,59,0.45)', padding: '0.75rem 1.1rem', borderRadius: '9px', border: `1px solid ${color}22` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '7px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <i className={`fas ${icon}`} style={{ color, fontSize: '0.8rem' }}></i>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</div>
                                    {sub && <div style={{ color: 'var(--text-light)', fontSize: '0.72rem' }}>{sub}</div>}
                                </div>
                            </div>
                            <span style={{ color, fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                                {sign} ₹{amount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    );

                    return (
                        <div className="glass" style={{ marginTop: '2rem', padding: '2rem', borderRadius: 'var(--radius-xl)', border: `1px solid ${theme.border}` }} data-aos="fade-up">

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0 }}>
                                    <i className="fas fa-file-invoice-dollar" style={{ color: theme.accent }}></i>
                                    Salary Slip
                                </h2>
                                <span style={{ background: theme.bg, color: theme.accent, border: `1px solid ${theme.border}`, padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className={`fas ${theme.icon}`}></i> {theme.label}
                                </span>
                            </div>

                            {/* Month label */}
                            <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                                <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i>
                                {new Date(monthVal + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </div>

                            {/* EARNINGS */}
                            <div style={{ marginBottom: '0.5rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Earnings</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                {row('fa-money-bill-wave', 'Basic Salary', basic, '#10b981', '+', 'Base pay')}
                                {row('fa-home', 'HRA (20%)', hra, '#06b6d4', '+', 'House Rent Allowance')}
                                {row('fa-car', 'Travel Allowance (5%)', ta, '#8b5cf6', '+', 'Conveyance')}
                                {row('fa-heartbeat', 'Medical Allowance (5%)', medical, '#ec4899', '+', 'Health benefit')}
                            </div>

                            {/* Gross total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16,185,129,0.1)', padding: '0.65rem 1.1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>Gross Salary</span>
                                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>₹{gross.toLocaleString('en-IN')}</span>
                            </div>

                            {/* DEDUCTIONS */}
                            <div style={{ marginBottom: '0.5rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Deductions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                {row('fa-piggy-bank', 'Provident Fund (12%)', pf, '#f59e0b', '−', 'Of basic salary')}
                                {row('fa-file-invoice', 'Income Tax (5%)', tax, '#ef4444', '−', 'TDS on basic')}
                                {row('fa-plane-departure', `Leave Days (${leaveDays})`, leaveDeduct, '#3b82f6', '−', `${leaveDays} day${leaveDays !== 1 ? 's' : ''} × ₹${perDay.toLocaleString('en-IN')}/day`)}
                                {row('fa-clock', `Late Days (${lateDays})`, lateDeduct, '#a855f7', '−', `${lateDays} day${lateDays !== 1 ? 's' : ''} × ½ day deduction`)}
                            </div>

                            {/* Divider */}
                            <div style={{ borderTop: `1px dashed ${theme.border}`, marginBottom: '1.25rem' }} />

                            {/* NET PAY */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.cardBg, padding: '1.1rem 1.4rem', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <i className={`fas ${theme.netIcon}`} style={{ color: theme.accent, fontSize: '1.3rem' }}></i>
                                    <div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Net Take-Home Pay</div>
                                        <div style={{ color: theme.accent, fontSize: '0.72rem' }}>{theme.sublabel}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: theme.accent, fontWeight: 800, fontSize: '1.6rem' }}>
                                        {ps === 'pending'
                                            ? <span style={{ filter: 'blur(5px)', userSelect: 'none' }}>₹{netPay.toLocaleString('en-IN')}</span>
                                            : `₹${netPay.toLocaleString('en-IN')}`}
                                    </div>
                                    <div style={{ color: 'var(--text-light)', fontSize: '0.72rem' }}>per month</div>
                                </div>
                            </div>

                            {/* Summary chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.1rem' }}>
                                <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Gross ₹{gross.toLocaleString('en-IN')}</span>
                                <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Deductions ₹{totalDeductions.toLocaleString('en-IN')}</span>
                                <span style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Leave {leaveDays}d · Late {lateDays}d</span>
                                <span style={{ background: theme.bg, color: theme.accent, padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Annual ₹{(netPay * 12).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    );
                })()}

                {/* ===== MY ATTENDANCE SECTION ===== */}
                <div className="glass" style={{ marginTop: '2rem', padding: '2rem', borderRadius: 'var(--radius-xl)' }} data-aos="fade-up">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <i className="fas fa-calendar-check" style={{ color: 'var(--primary-color)' }}></i>
                        My Attendance
                    </h2>

                    {/* Tab + Date Picker */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <button onClick={() => setAttTab('daily')} className={`btn ${attTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}>
                            <i className="fas fa-calendar-day"></i> Daily
                        </button>
                        <button onClick={() => setAttTab('monthly')} className={`btn ${attTab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}>
                            <i className="fas fa-calendar"></i> Monthly
                        </button>
                        {attTab === 'daily' && (
                            <input type="date" className="form-input" style={{ maxWidth: '200px' }}
                                value={dailyDate} max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setDailyDate(e.target.value)} />
                        )}
                        {attTab === 'monthly' && (
                            <input type="month" className="form-input" style={{ maxWidth: '200px' }}
                                value={monthVal} onChange={(e) => setMonthVal(e.target.value)} />
                        )}
                    </div>

                    {/* Monthly Stats Cards */}
                    {attTab === 'monthly' && !attLoading && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Present', value: attStats.present, color: '#10b981', icon: 'fa-user-check' },
                                { label: 'Late', value: attStats.late, color: '#f59e0b', icon: 'fa-clock' },
                                { label: 'On Leave', value: attStats.leave, color: '#3b82f6', icon: 'fa-plane-departure' },
                                { label: 'Total', value: attStats.total, color: '#8b5cf6', icon: 'fa-list' },
                            ].map(s => (
                                <div key={s.label} style={{ background: 'rgba(30,41,59,0.5)', border: `1px solid ${s.color}40`, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                                    <i className={`fas ${s.icon}`} style={{ fontSize: '1.5rem', color: s.color, marginBottom: '6px' }}></i>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Attendance Table */}
                    {attLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
                            {[1, 2, 3, 4].map(i => <div key={i} className="att-skeleton" />)}
                        </div>
                    ) : attRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                            <i className="fas fa-inbox" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                            <p style={{ marginTop: '1rem' }}>No attendance records found.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(30,41,59,0.6)' }}>
                                        {attTab === 'monthly' && (
                                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Date</th>
                                        )}
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Day</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Clock In</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Clock Out</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attRecords.map((rec, i) => {
                                        const d = rec.date || rec.attendance_date || '';
                                        const dateObj = d ? new Date(d) : null;
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,41,59,0.2)' }}>
                                                {attTab === 'monthly' && (
                                                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                                                        {dateObj ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </td>
                                                )}
                                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                                                    {dateObj ? dateObj.toLocaleDateString('en-IN', { weekday: 'short' }) : '-'}
                                                </td>
                                                <td style={{ padding: '10px 14px', color: 'var(--success-color)', fontWeight: 500 }}>{rec.clock_in || '-'}</td>
                                                <td style={{ padding: '10px 14px', color: 'var(--primary-color)', fontWeight: 500 }}>{rec.clock_out || '-'}</td>
                                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                    <span style={statusStyle(rec.status)}>
                                                        {rec.status ? rec.status.charAt(0).toUpperCase() + rec.status.slice(1) : '-'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>{rec.hours || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default MyProfile;
