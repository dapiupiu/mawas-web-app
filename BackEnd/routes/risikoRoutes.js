const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');

router.get('/', risikoController.getAllRisiko);
router.get('/:kode', risikoController.getRisikoByKode);
router.post('/seed', risikoController.seedRisikoData);

module.exports = router;