const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Endpoint Auth Publik (Tanpa Token)
router.post('/login', authController.login);
router.post('/register', authController.register); // Dinonaktifkan via controller
router.get('/google', authController.googleLogin); // Route Google OAuth

// Endpoint Edit Profil & Ganti Password (Khusus User Terautentikasi)
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post(
    '/profile/avatar',
    authenticateToken,
    express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }),
    authController.uploadAvatar
);

module.exports = router;