require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const registerSocket = require('./src/socket');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // behind Render/Heroku/etc. proxies

const origins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
const corsOrigin = origins.includes('*') ? '*' : origins;

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '100kb' }));

const limiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message } });
app.use('/api/login', limiter(15 * 60 * 1000, 20, 'Too many login attempts, try again later'));
app.use('/api/register', limiter(60 * 60 * 1000, 20, 'Too many sign-ups, try again later'));
app.use('/register', limiter(60 * 60 * 1000, 20, 'Too many sign-ups, try again later'));

const authRoutes = require('./src/routes/auth');
app.use('/api', authRoutes);                   // /api/login, /api/register, /api/me
app.post('/register', (req, res, next) => {    // Register.jsx posts to `${API_URL}/register`
  req.url = '/register';
  authRoutes(req, res, next);
});
app.use('/api/search', require('./src/routes/search'));
app.use('/api/buses', require('./src/routes/buses'));
app.use('/api/routes', require('./src/routes/routes'));
app.use('/api/driver', require('./src/routes/driver'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/subscriptions', require('./src/routes/subscriptions'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/', (_req, res) => res.json({ message: 'GoSwift backend is running' }));
app.get('/ping', (_req, res) => res.send('ok')); // for uptime monitors

app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });
app.set('io', io);
registerSocket(io);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`GoSwift backend listening on :${PORT}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
