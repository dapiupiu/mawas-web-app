require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
  res.json({ message: "Server mawas berjalan lancar!" });
});

module.exports = app;
