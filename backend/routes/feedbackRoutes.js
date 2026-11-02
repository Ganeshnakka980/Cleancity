const express = require('express');
const router = express.Router();
const { submitFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { validateFeedbackReq } = require('../middleware/validationMiddleware');

router.use(protect);

router.post('/', validateFeedbackReq, submitFeedback);
router.get('/my', getMyFeedback);

module.exports = router;
