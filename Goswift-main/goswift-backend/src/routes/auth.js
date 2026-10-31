const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[0-9+\-\s]{7,20}$/;

// POST /api/register   (also mounted at /register, because Register.jsx calls `${API_URL}/register`)
// Body: { name, email, password, role?: 'user' | 'driver', phone? }
// Returns a token, so the person is logged in straight after signing up.
// Drivers need a phone number and start "not approved" until an admin approves them.
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const wantsDriver = req.body.role === 'driver';
    const phone = String(req.body.phone || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Invalid email address' });
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (wantsDriver && !PHONE_RE.test(phone)) {
      return res.status(400).json({ message: 'A valid phone number is required for driver sign-up' });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Only 'user' and 'driver' can be chosen here - 'admin' can never be requested from outside.
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: wantsDriver ? 'driver' : 'user',
      approved: !wantsDriver,
      phone: phone || undefined
    });
    res.status(201).json({
      message: wantsDriver ? 'Driver account created. An admin must approve it before you can drive.' : 'Account created successfully',
      token: signToken(user),
      user: user.toSafeJSON()
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    next(err);
  }
});

// POST /api/login  { email, password, loginAs?: 'user' | 'driver' }  ->  { token, user }
// loginAs keeps the two logins separate: a driver cannot use the passenger form and vice versa.
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const loginAs = req.body.loginAs;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    if (loginAs === 'driver' && user.role === 'user') {
      return res.status(403).json({ message: 'This is a passenger account. Please use Passenger login.' });
    }
    if (loginAs === 'user' && user.role === 'driver') {
      return res.status(403).json({ message: 'This is a driver account. Please use Driver login.' });
    }

    res.json({ message: 'Login successful', token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// GET /api/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafeJSON() }));

module.exports = router;
