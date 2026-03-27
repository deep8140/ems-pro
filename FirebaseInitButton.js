import React, { useState } from 'react';
import { initializeEverything } from '../utils/initializeFirebase';

/**
 * Firebase Initialization Button
 * 
 * Add this to your Login page to easily initialize Firebase with demo data
 */

function FirebaseInitButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleInitialize = async () => {
        if (!window.confirm('Initialize Firebase with demo data?\n\nThis will create:\n- 5 employees\n- 7 days of attendance data')) {
            return;
        }

        setLoading(true);
        setMessage('Initializing Firebase...');

        try {
            const result = await initializeEverything();

            if (result.success) {
                setMessage('✅ Success! Firebase initialized with demo data.');
                localStorage.setItem('firebaseInitialized', 'true');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setMessage('⚠️ ' + result.message);
            }
        } catch (error) {
            setMessage('❌ Error: ' + error.message);
            console.error('Initialization error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if already initialized
    const isInitialized = localStorage.getItem('firebaseInitialized');

    if (isInitialized) {
        return null; // Don't show button if already initialized
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000
        }}>
            <button
                onClick={handleInitialize}
                disabled={loading}
                style={{
                    padding: '12px 24px',
                    background: loading ? '#666' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    if (!loading) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
            >
                {loading ? '⏳ Initializing...' : '🔥 Initialize Firebase'}
            </button>

            {message && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '12px',
                    maxWidth: '250px',
                    textAlign: 'center'
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}

export default FirebaseInitButton;
