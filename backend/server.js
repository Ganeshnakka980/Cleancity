const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const userRoutes = require('./routes/userRoutes');
const rewardRoutes = require('./routes/rewardRoutes');

// Import Socket.IO handlers in controllers/services
const complaintController = require('./controllers/complaintController');
const staffController = require('./controllers/staffController');
const adminController = require('./controllers/adminController');
const notificationService = require('./services/notificationService');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Atlas
connectDB();

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true
  })
);

// Helmet Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: 'origin-when-cross-origin' }
  })
);

// Morgan HTTP Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', generalLimiter);

// Serve static frontend files and uploads
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach socket instance to controllers
complaintController.setSocketIO(io);
staffController.setSocketIO(io);
adminController.setSocketIO(io);
notificationService.setSocketIO(io);

// Socket Authentication & Room joins
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cleancity_super_secret_jwt_key_2026_production_hardening');
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next();
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }

  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {});
});

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CleanCity API is running',
    database: 'connected',
    timestamp: new Date()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);

// SPA fallback for HTML frontend routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[CleanCity Server] Running on http://localhost:${PORT}`);
});

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log('[CleanCity Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[CleanCity Server] HTTP & Socket.IO servers closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = { app, server };
