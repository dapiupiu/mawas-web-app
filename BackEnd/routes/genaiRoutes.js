const express = require('express');
const router = express.Router();
const genaiController = require('../controllers/genaiController');

router.get('/:kode', (req, res) => genaiController.handleGenAI(req, res));

module.exports = router;
