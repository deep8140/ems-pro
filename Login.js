import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({
        id: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            const user = JSON.parse(sessionStorage.getItem('authUser'));
            const redirectPage = (user?.role === 'admin' || user?.role === 'manager')
                ? '/dashboard'
                : '/my-profile';
            navigate(redirectPage);
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.id || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.login(formData.id, formData.password);

            if (response.success && response.token) {
                setSuccess('Login successful! Redirecting...');

                // Store token and user data using auth context
                login(response.user, response.token);

                setTimeout(() => {
                    const redirectPage = (response.user.role === 'admin' || response.user.role === 'manager')
                        ? '/dashboard'
                        : '/my-profile';
                    navigate(redirectPage);
                }, 1500);
            } else {
                setError(response.error || 'Invalid credentials');
            }
        } catch (err) {
            console.error(err);
            setError('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
            <div className="glass" style={{ padding: '3.125rem 2.5rem', width: '100%', maxWidth: '28rem', position: 'relative', overflow: 'hidden' }} data-aos="fade-up" data-aos-duration="800">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '5rem',
                        height: '5rem',
                        margin: '0 auto 1.25rem',
                        background: 'var(--primary-gradient)',
                        borderRadius: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: 'white',
                        boxShadow: '0 10px 30px rgba(14, 165, 233, 0.4)'
                    }} data-aos="zoom-in" data-aos-delay="200">
                        EP
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem'
                    }} data-aos="fade-down" data-aos-delay="400">
                        EMS Pro
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500' }} data-aos="fade-down" data-aos-delay="600">
                        Employee Management System
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" data-aos="fade-right" data-aos-delay="800">
                        <label className="form-label" htmlFor="id">
                            Employee ID
                        </label>
                        <input
                            type="text"
                            id="id"
                            name="id"
                            className="form-input"
                            placeholder="Enter your employee ID"
                            value={formData.id}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group" data-aos="fade-left" data-aos-delay="1000">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: '0.625rem' }}
                        data-aos="zoom-in"
                        data-aos-delay="1200"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="message" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--error-color)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--spacing-md)',
                        fontWeight: '500',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="message" style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--success-color)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--spacing-md)',
                        fontWeight: '500',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
