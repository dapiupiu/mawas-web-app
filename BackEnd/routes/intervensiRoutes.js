const express = require('express');
const router = express.Router();
const intervensiController = require('../controllers/intervensiController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Get daftar program intervensi (Publik / Dashboard)
router.get('/', intervensiController.getAllIntervensi);

// Tambah usulan intervensi baru (Khusus Operator / Superadmin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  intervensiController.createIntervensi
);

// Update status program intervensi (Khusus Operator / Superadmin)
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  intervensiController.updateStatusIntervensi
);

// Hapus program intervensi (Khusus Operator / Superadmin)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  intervensiController.deleteIntervensi
);

module.exports = router;