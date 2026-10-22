const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');
const analisisController = require('../controllers/analisisController');

// Route CRUD dasar data risiko
router.get('/', risikoController.getAllRisiko);
router.get('/:kode', risikoController.getRisikoByKode);
router.post('/seed', risikoController.seedRisikoData);

// Endpoint baru khusus analisis Generative AI (Gemini)
router.get('/:kode/analisis', analisisController.getAnalisisWilayah);

module.exports = router;