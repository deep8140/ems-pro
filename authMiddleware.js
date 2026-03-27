// JWT Authentication Middleware
const jwt = require('jsonwebtoken');

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Generate JWT token
const generateToken = (user) => {
    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    next();
};

module.exports = {
    generateToken,
    verifyToken,
    isAdmin,
    JWT_SECRET
};
