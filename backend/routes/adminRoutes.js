const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAnalytics,
  getHotspots,
  getUsers,
  toggleUserStatus,
  createStaff,
  getStaffList,
  assignComplaint,
  updatePriority,
  getFeedbackList,
  getAuditLogs
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/analytics', getAnalytics);
router.get('/hotspots', getHotspots);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.put('/users/:id/status', toggleUserStatus);

router.post('/staff', createStaff);
router.get('/staff', getStaffList);

router.patch('/complaints/:id/assign', assignComplaint);
router.put('/complaints/:id/assign', assignComplaint);

router.patch('/complaints/:id/priority', updatePriority);
router.put('/complaints/:id/priority', updatePriority);

router.get('/feedback', getFeedbackList);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
