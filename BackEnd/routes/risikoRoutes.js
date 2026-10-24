const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');
const analisisController = require('../controllers/analisisController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Route Publik
router.get('/', risikoController.getAllRisiko);
router.get('/summary', risikoController.getDashboardSummary); // Widget Banner Top Dashboard
router.get('/trend-nasional', risikoController.getTrenNasional); // Grafik Tren Landing Page Section 1
router.post(
  '/import',
  authenticateToken,
  authorizeRoles('operator', 'superadmin'),
  risikoController.importRisiko
);
router.get('/:kode', risikoController.getRisikoByKode);
router.get('/:kode/analisis', analisisController.getAnalisisWilayah);

// Route Petugas / Admin
router.post('/seed', authenticateToken, authorizeRoles('operator', 'superadmin'), risikoController.seedRisikoData);

module.exports = router;