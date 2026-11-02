const User = require('../models/User');
const Reward = require('../models/Reward');
const { createNotification } = require('./notificationService');

const calculateLevel = (points) => {
  if (points >= 600) return 'Eco Champion';
  if (points >= 300) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
};

const awardPoints = async (
  userId,
  pointsToAward,
  reason,
  options = {}
) => {
  try {
    const { referenceType = 'system', referenceId = null, rewardType = 'custom' } = options;

    const user = await User.findById(userId);
    if (!user) return null;

    let rewardDoc = await Reward.findOne({ userId });
    if (!rewardDoc) {
      rewardDoc = new Reward({
        userId,
        points: 0,
        level: 'Bronze',
        history: []
      });
    }

    // Check for Duplicate Reward Awarding for the same referenceId and rewardType
    if (referenceId && rewardType !== 'custom') {
      const alreadyAwarded = rewardDoc.history.some(
        (entry) =>
          entry.referenceId === referenceId.toString() && entry.rewardType === rewardType
      );
      if (alreadyAwarded) {
        console.log(`[Reward Service] Duplicate reward prevented for User ${userId}, Ref: ${referenceId}, Type: ${rewardType}`);
        return { duplicate: true, points: user.points, level: rewardDoc.level };
      }
    }

    user.points += pointsToAward;
    await user.save();

    rewardDoc.points = user.points;
    const oldLevel = rewardDoc.level;
    const newLevel = calculateLevel(user.points);
    rewardDoc.level = newLevel;

    rewardDoc.history.push({
      points: pointsToAward,
      reason,
      referenceType,
      referenceId: referenceId ? referenceId.toString() : null,
      rewardType,
      createdAt: new Date()
    });

    await rewardDoc.save();

    let message = `You earned +${pointsToAward} EcoPoints for: ${reason}. Total points: ${user.points}.`;
    if (oldLevel !== newLevel) {
      message += ` Congratulations! You reached ${newLevel} level!`;
    }

    await createNotification({
      userId,
      title: 'EcoPoints Awarded!',
      message,
      type: 'success'
    });

    return {
      points: user.points,
      level: newLevel,
      rewardDoc
    };
  } catch (error) {
    console.error(`[Reward Service Error] ${error.message}`);
    return null;
  }
};

module.exports = {
  calculateLevel,
  awardPoints
};
