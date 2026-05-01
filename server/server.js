require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { globalErrorHandler, AppError } = require('./utils/errorHandler');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api', resumeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AI Resume Analyzer API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// ── Server Start ─────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// ── Database Connection (non-blocking) ──────────────────────────────
connectDB();

module.exports = app;

