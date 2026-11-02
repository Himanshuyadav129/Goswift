// Browser push notifications (work even when the website is closed).
// Needs `web-push` installed and VAPID keys in .env (run: node scripts/gen-vapid.js). Otherwise it silently does nothing.
const PushSubscription = require('../models/PushSubscription');

let webpush;
function getWebPush() {
  if (webpush !== undefined) return webpush;
  webpush = null;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return webpush;
  try {
    const wp = require('web-push');
    wp.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@goswift.local', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    webpush = wp;
  } catch (err) {
    console.warn('Push disabled:', err.message.includes('Cannot find module') ? 'run npm install (web-push missing)' : err.message);
  }
  return webpush;
}

const isPushEnabled = () => !!getWebPush();

/** payload: { title, body, url?, tag? }. Never throws. Dead subscriptions (404/410) are deleted. */
async function sendPushToUsers(userIds, payload) {
  const wp = getWebPush();
  if (!wp || !userIds || !userIds.length) return 0;
  let sent = 0;
  try {
    const subs = await PushSubscription.find({ user: { $in: userIds } });
    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, body, { TTL: 3600 });
          sent++;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) await PushSubscription.deleteOne({ _id: s._id });
          else console.error('Push failed:', err.statusCode || err.message);
        }
      })
    );
  } catch (err) {
    console.error('Push error:', err.message);
  }
  return sent;
}

module.exports = { sendPushToUsers, isPushEnabled };
