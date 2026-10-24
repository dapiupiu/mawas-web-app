const express = require('express');
const router = express.Router();
const produksiController = require('../controllers/produksiController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Get daftar laporan produksi pangan (Publik / Dashboard)
router.get('/', produksiController.getAllProduksi);

// Tambah laporan produksi pangan baru (Khusus Operator / Superadmin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  produksiController.createProduksi
);

// Hapus laporan produksi (Khusus Operator / Superadmin)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  produksiController.deleteProduksi
);

module.exports = router;