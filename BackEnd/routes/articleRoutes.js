const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const superadminOnly = [authenticateToken, authorizeRoles('superadmin')];

router.get('/manage', ...superadminOnly, articleController.listManage);
router.post('/upload-image', ...superadminOnly, express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp'],
  limit: '4mb',
}), articleController.uploadImage);
router.delete('/upload-image', ...superadminOnly, articleController.deleteImage);
router.get('/', articleController.listPublished);
router.get('/:id', articleController.getPublishedById);
router.post('/', ...superadminOnly, articleController.create);
router.patch('/:id', ...superadminOnly, articleController.update);
router.delete('/:id', ...superadminOnly, articleController.remove);

module.exports = router;
