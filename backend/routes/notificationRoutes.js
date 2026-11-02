const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
// Support PUT as well for compatibility
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
