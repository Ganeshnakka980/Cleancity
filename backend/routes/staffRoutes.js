const express = require('express');
const router = express.Router();
const {
  getAssignedComplaints,
  getStaffStats,
  acceptComplaint,
  submitResolutionProof
} = require('../controllers/staffController');
const { updateComplaintStatus } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('staff', 'admin'));

router.get('/complaints', getAssignedComplaints);
router.get('/stats', getStaffStats);
router.put('/complaints/:id/accept', acceptComplaint);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.put('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/resolve', upload.single('resolutionImage'), submitResolutionProof);
router.post('/complaints/:id/proof', upload.single('resolutionImage'), submitResolutionProof);

module.exports = router;
