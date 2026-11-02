const express = require('express');
const router = express.Router();
const {
  checkDuplicate,
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaintById,
  getNearbyComplaints,
  updateComplaintStatus,
  deleteComplaint
} = require('../controllers/complaintController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateComplaintReq } = require('../middleware/validationMiddleware');

router.post('/check-duplicate', protect, checkDuplicate);
router.post('/', protect, upload.single('image'), validateComplaintReq, createComplaint);
router.get('/', protect, getComplaints);
router.get('/my', protect, authorize('citizen'), getMyComplaints);
router.get('/nearby', getNearbyComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, updateComplaintStatus);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);

module.exports = router;
