const Reward = require('../models/Reward');

const getMyReward = async (req, res, next) => {
  try {
    let reward = await Reward.findOne({ userId: req.user._id });
    if (!reward) {
      reward = {
        userId: req.user._id,
        points: req.user.points || 0,
        level: 'Bronze',
        history: []
      };
    }
    res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    next(error);
  }
};

const getRewardHistory = async (req, res, next) => {
  try {
    const reward = await Reward.findOne({ userId: req.user._id });
    const history = reward ? reward.history.reverse() : [];
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyReward,
  getRewardHistory
};
