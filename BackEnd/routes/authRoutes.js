const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Endpoint Auth Publik (Tanpa Token)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleLogin); // Route Google OAuth

// Endpoint Terproteksi (Contoh pengujian RBAC)

// 1. Khusus Operator & Admin (Input Data Stok)
router.post('/stok-pangan', authenticateToken, authorizeRoles('operator', 'admin'), (req, res) => {
    res.json({ 
        message: "Akses diberikan! Kamu berhasil mengakses endpoint khusus Operator/Admin.",
        user: req.user
    });
});

// 2. Khusus Operator & Admin (Dashboard Operator - Ringkasan Tugas & Input)
router.get('/operator-dashboard', authenticateToken, authorizeRoles('operator', 'admin'), (req, res) => {
    res.json({ 
        message: "Selamat datang di Dashboard Operator! Kamu memiliki akses untuk menginput & memverifikasi data.",
        user: req.user
    });
});

// 3. Khusus Admin (Dashboard Admin - Kelola Pengguna & Sistem)
router.get('/admin-dashboard', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({ 
        message: "Selamat datang di Dashboard Admin! Kamu memiliki hak akses penuh sebagai Admin.",
        user: req.user
    });
});

module.exports = router;