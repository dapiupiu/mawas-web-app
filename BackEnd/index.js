require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
);

function isAllowedOrigin(origin) {
  const isLocalDevelopment = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return isLocalDevelopment || allowedOrigins.has(origin.replace(/\/+$/, ''));
}

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (!origin || isAllowedOrigin(origin)) return next();

  return res.status(403).json({ message: 'Origin not allowed by CORS' });
});

app.use(cors({
  origin(origin, callback) {
    return callback(null, Boolean(origin));
  },
}));
app.use(express.json({ limit: '10mb' }));

// 0. Route GenAI (Proxy Groq)
const genaiRoutes = require('./routes/genaiRoutes');
app.use('/api/genai', genaiRoutes);

// 1. Route Auth
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 2. Route Risiko Wilayah (F01 & Peta Spasial)
const risikoRoutes = require('./routes/risikoRoutes');
app.use('/api/risiko', risikoRoutes);

// 3. Route Verifikasi Risiko (F04 - Tugas & Verifikasi AI)
const verifikasiRoutes = require('./routes/verifikasiRoutes');
app.use('/api/verifikasi', verifikasiRoutes);

// 4. Route Produksi Pangan (F03 - Data Produksi Pangan)
const produksiRoutes = require('./routes/produksiRoutes');
app.use('/api/produksi', produksiRoutes);

// 5. Route Intervensi Mitigasi (F05 - Manajemen Intervensi)
const intervensiRoutes = require('./routes/intervensiRoutes');
app.use('/api/intervensi', intervensiRoutes);

// 6. Route User Management (Khusus SuperAdmin)
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// 7. CMS Artikel (publikasi publik dan pengelolaan Superadmin)
const articleRoutes = require('./routes/articleRoutes');
app.use('/api/articles', articleRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Server mawas berjalan lancar!" });
});

module.exports = app;
