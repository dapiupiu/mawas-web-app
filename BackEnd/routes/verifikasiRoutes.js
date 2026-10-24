const express = require('express');
const router = express.Router();
const verifikasiController = require('../controllers/verifikasiController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Get list tugas verifikasi (Dapat diakses oleh publik/operator)
router.get('/', verifikasiController.getTugasVerifikasi);

// Submit verifikasi / koreksi (Khusus Operator & Superadmin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  verifikasiController.submitVerifikasi
);

module.exports = router;