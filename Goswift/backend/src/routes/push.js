const express = require('express');
const PushSubscription = require('../models/PushSubscription');
const { requireAuth } = require('../middleware/auth');
const { isPushEnabled } = require('../services/push');

const router = express.Router();

// GET /api/push/public-key  -> { enabled, publicKey }
router.get('/public-key', (_req, res) => {
  const enabled = isPushEnabled();
  res.json({ enabled, publicKey: enabled ? process.env.VAPID_PUBLIC_KEY : null });
});

// POST /api/push/subscribe  { endpoint, keys:{p256dh,auth} }
router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }
    const count = await PushSubscription.countDocuments({ user: req.user._id });
    const existing = await PushSubscription.exists({ endpoint });
    if (!existing && count >= 10) return res.status(400).json({ message: 'Too many devices registered' });
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: 'Push enabled' });
  } catch (err) {
    next(err);
  }
});

// POST /api/push/unsubscribe { endpoint }
router.post('/unsubscribe', requireAuth, async (req, res, next) => {
  try {
    await PushSubscription.deleteOne({ endpoint: String(req.body?.endpoint || ''), user: req.user._id });
    res.json({ message: 'Push disabled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
