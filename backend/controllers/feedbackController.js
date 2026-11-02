const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const { awardPoints } = require('../services/rewardService');

const submitFeedback = async (req, res, next) => {
  try {
    const { complaintId, rating, comment } = req.body;

    const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: { $ne: true } });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Ownership check
    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit feedback for complaints reported by you'
      });
    }

    // Status check: Feedback allowed only on resolved or verified complaints
    if (!['resolved', 'verified'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for resolved or verified complaints'
      });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Duplicate check
    const existingFeedback = await Feedback.findOne({ complaintId, userId: req.user._id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this complaint'
      });
    }

    const feedback = await Feedback.create({
      complaintId,
      userId: req.user._id,
      rating: numericRating,
      comment: comment || ''
    });

    // Award +5 EcoPoints to Citizen for submitting valid feedback
    await awardPoints(req.user._id, 5, `Submitted feedback for complaint ${complaint.complaintId}`, {
      referenceType: 'feedback',
      referenceId: feedback._id,
      rewardType: 'feedback_submitted'
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for helping clean the city!',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

const getMyFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id })
      .populate('complaintId', 'complaintId category address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback
};
