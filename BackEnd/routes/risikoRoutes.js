const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');
const analisisController = require('../controllers/analisisController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Route publik (siapa saja boleh lihat data & analisis)
router.get('/', risikoController.getAllRisiko);
router.get('/:kode', risikoController.getRisikoByKode);
router.get('/:kode/analisis', analisisController.getAnalisisWilayah);

// Route khusus Petugas (Wajib Login & Role: 'operator' atau 'superadmin')
router.post('/seed', authenticateToken, authorizeRoles('operator', 'superadmin'), risikoController.seedRisikoData);

module.exports = router;