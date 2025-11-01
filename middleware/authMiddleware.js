const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Attach user to the request object
        req.user = await User.findByPk(decoded.user.id, { attributes: { exclude: ['password'] } });

        if (!req.user) {
            return res.status(401).json({ msg: 'Token is not valid' });
        }

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};