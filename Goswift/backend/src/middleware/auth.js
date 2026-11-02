const jwt = require('jsonwebtoken');
const User = require('../models/User');

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d' // stay logged in until logout (or 30 days)
  });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to do this' });

// A driver who signed up on their own cannot drive until an admin approves the account
const requireApproved = (req, res, next) =>
  req.user.role === 'driver' && req.user.approved === false
    ? res.status(403).json({ message: 'Your driver account is waiting for admin approval' })
    : next();

module.exports = { signToken, verifyToken, requireAuth, requireRole, requireApproved };
