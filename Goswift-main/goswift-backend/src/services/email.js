// Optional e-mail alerts. Works only when SMTP_* variables are set AND `nodemailer` is installed;
// otherwise it silently does nothing (in-app notifications still work).
let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  transporter = null;
  if (!process.env.SMTP_HOST) return transporter;
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  } catch {
    console.warn('SMTP_HOST is set but nodemailer is not installed (npm i nodemailer). E-mail alerts disabled.');
  }
  return transporter;
}

async function sendEmail(to, subject, text) {
  const t = getTransporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
}

module.exports = { sendEmail };
