const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// Proteksi Ketat: Wajib Login & Hanya Boleh Diakses oleh SuperAdmin
router.use(authenticateToken, authorizeRoles('superadmin'));

router.get('/operators', userController.getAllOperators);
router.post('/operators', userController.createOperator);
router.delete('/operators/:id', userController.deleteOperator);

module.exports = router;