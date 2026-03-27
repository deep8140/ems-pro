import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const getNavItems = () => {
        if (!user) return [];

        const commonItems = [
            { path: '/my-profile', label: 'My Profile', icon: 'fas fa-user' }
        ];

        if (user.role === 'admin' || user.role === 'manager') {
            return [
                { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
                { path: '/employees', label: 'Employees', icon: 'fas fa-users' },
                { path: '/attendance', label: 'Attendance', icon: 'fas fa-calendar-check' },
                ...(user.role === 'admin' ? [{ path: '/payroll', label: 'Payroll', icon: 'fas fa-money-bill-wave' }] : []),
                ...commonItems
            ];
        }

        return commonItems;
    };

    if (!user) return null;

    return (
        <nav className="navbar" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: '1rem 0'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to={user.role === 'admin' || user.role === 'manager' ? '/dashboard' : '/my-profile'}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: 'var(--primary-gradient)',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: 'white'
                    }}>
                        EP
                    </div>
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        EMS Pro
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {getNavItems().map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    textDecoration: 'none',
                                    color: isActive(item.path) ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all 0.3s ease',
                                    background: isActive(item.path) ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                    border: isActive(item.path) ? '1px solid rgba(14, 165, 233, 0.2)' : '1px solid transparent'
                                }}
                            >
                                <i className={item.icon}></i>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '2.25rem',
                                height: '2.25rem',
                                borderRadius: '50%',
                                background: 'var(--success-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '0.875rem'
                            }}>
                                {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                    {user.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary btn-sm"
                            style={{ marginLeft: '0.5rem' }}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="mobile-menu-btn"
                    style={{
                        display: 'none',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>

            {isMenuOpen && (
                <div className="mobile-nav" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-color)',
                    borderTop: 'none',
                    padding: '1rem'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {getNavItems().map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    textDecoration: 'none',
                                    color: isActive(item.path) ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: isActive(item.path) ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                    border: isActive(item.path) ? '1px solid rgba(14, 165, 233, 0.2)' : '1px solid transparent'
                                }}
                            >
                                <i className={item.icon}></i>
                                {item.label}
                            </Link>
                        ))}
                        <hr style={{ border: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'var(--error-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.75rem 1rem',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .desktop-nav {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: block !important;
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navigation;
