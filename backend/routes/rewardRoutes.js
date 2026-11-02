const express = require('express');
const router = express.Router();
const { getMyReward, getRewardHistory } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyReward);
router.get('/history', getRewardHistory);

module.exports = router;
