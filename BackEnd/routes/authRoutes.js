const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Endpoint Auth Publik (Tanpa Token)
router.post('/login', authController.login);
router.post('/register', authController.register); // Dinonaktifkan via controller
router.get('/google', authController.googleLogin); // Route Google OAuth

// Endpoint Edit Profil & Ganti Password (Khusus User Terautentikasi)
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);

// Endpoint Terproteksi (Pengujian RBAC)

// 1. Khusus Operator & SuperAdmin (Input Data Stok)
router.post('/stok-pangan', authenticateToken, authorizeRoles('operator', 'superadmin'), (req, res) => {
    res.json({ 
        message: "Akses diberikan! Kamu berhasil mengakses endpoint khusus Operator/SuperAdmin.",
        user: req.user
    });
});

// 2. Khusus Operator & SuperAdmin (Dashboard Operator - Ringkasan Tugas & Input)
router.get('/operator-dashboard', authenticateToken, authorizeRoles('operator', 'superadmin'), (req, res) => {
    res.json({ 
        message: "Selamat datang di Dashboard Operator! Kamu memiliki akses untuk menginput & memverifikasi data.",
        user: req.user
    });
});

// 3. Khusus SuperAdmin (Dashboard SuperAdmin - Kelola Pengguna & Sistem)
router.get('/admin-dashboard', authenticateToken, authorizeRoles('superadmin'), (req, res) => {
    res.json({ 
        message: "Selamat datang di Dashboard SuperAdmin! Kamu memiliki hak akses penuh sebagai SuperAdmin.",
        user: req.user
    });
});

module.exports = router;