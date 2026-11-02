const mongoose = require('mongoose');

const rewardHistorySchema = new mongoose.Schema(
  {
    points: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    referenceType: {
      type: String,
      enum: ['complaint', 'feedback', 'system'],
      default: 'system'
    },
    referenceId: {
      type: String,
      default: null
    },
    rewardType: {
      type: String,
      enum: ['welcome_bonus', 'report_created', 'report_verified', 'task_resolved', 'feedback_submitted', 'custom'],
      default: 'custom'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    points: {
      type: Number,
      default: 0
    },
    level: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Eco Champion'],
      default: 'Bronze'
    },
    history: [rewardHistorySchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Reward', rewardSchema);
