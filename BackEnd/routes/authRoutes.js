const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Mendefinisikan endpoint POST untuk register dan login
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;