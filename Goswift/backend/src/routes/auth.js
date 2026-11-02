const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendEmail } = require('../services/email');

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
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const GENERIC = 'If an account with that email exists, a reset link has been sent.';

// POST /api/forgot-password { email }  - always answers the same, so it can't be used to find accounts
router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });

    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = sha256(token);
      user.resetTokenExpires = new Date(Date.now() + 30 * 60000);
      await user.save();

      const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const link = `${base}/reset-password?token=${token}`;
      const sent = await sendEmail(
        user.email,
        'GoSwift: reset your password',
        `Hi ${user.name},\n\nOpen this link to choose a new password (valid for 30 minutes):\n${link}\n\nIf you did not ask for this, ignore this email.\n\n- GoSwift`
      );
      // Development helper: no SMTP set up -> print the link in the server console instead
      if (!sent && process.env.NODE_ENV !== 'production') console.log(`[dev] Password reset link for ${user.email}: ${link}`);
    }
    res.json({ message: GENERIC });
  } catch (err) {
    next(err);
  }
});

// POST /api/reset-password { token, password }
router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() } }).select('+password');
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: 'Password changed. You can log in now.' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafeJSON() }));

module.exports = router;
