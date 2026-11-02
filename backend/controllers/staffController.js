const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { getFileUrl } = require('../services/uploadService');
const { createNotification } = require('../services/notificationService');
const { awardPoints } = require('../services/rewardService');
const { canTransitionStatus } = require('../utils/statusTransitions');

let ioInstance = null;
const setSocketIO = (io) => {
  ioInstance = io;
};

// Get complaints assigned to logged-in staff member
const getAssignedComplaints = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filter = { assignedTo: req.user._id, isDeleted: { $ne: true } };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name phone email'),
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get workload statistics for staff
const getStaffStats = async (req, res, next) => {
  try {
    const staffId = req.user._id;

    const [totalAssigned, inProgress, resolved, pendingAccept] = await Promise.all([
      Complaint.countDocuments({ assignedTo: staffId, isDeleted: { $ne: true } }),
      Complaint.countDocuments({ assignedTo: staffId, status: 'in_progress', isDeleted: { $ne: true } }),
      Complaint.countDocuments({ assignedTo: staffId, status: { $in: ['resolved', 'verified'] }, isDeleted: { $ne: true } }),
      Complaint.countDocuments({ assignedTo: staffId, status: 'assigned', isDeleted: { $ne: true } })
    ]);

    const resolutionRate = totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        totalAssigned,
        pendingAccept,
        inProgress,
        resolved,
        resolutionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Accept complaint task and start work
const acceptComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Complaint is not assigned to you' });
    }

    const check = canTransitionStatus({
      currentStatus: complaint.status,
      newStatus: 'in_progress',
      role: req.user.role,
      isOwner: false,
      isAssignedStaff: true
    });

    if (!check.allowed) {
      return res.status(400).json({ success: false, message: check.message });
    }

    complaint.status = 'in_progress';
    complaint.statusHistory.push({
      status: 'in_progress',
      changedBy: req.user._id,
      note: 'Staff accepted assignment and started cleaning work',
      changedAt: new Date()
    });

    await complaint.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'START_WORK',
      entityType: 'Complaint',
      entityId: complaint._id.toString(),
      details: { complaintId: complaint.complaintId }
    });

    await createNotification({
      userId: complaint.userId,
      title: 'Work Started',
      message: `Municipal staff has started work on complaint ${complaint.complaintId}.`,
      type: 'info'
    });

    if (ioInstance) {
      ioInstance.to(`user:${complaint.userId.toString()}`).emit('complaintStatusUpdated', complaint);
      ioInstance.to('role:admin').emit('complaintStatusUpdated', complaint);
    }

    res.status(200).json({
      success: true,
      message: 'Work started on complaint',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Upload proof of cleaning and mark complaint as resolved
const submitResolutionProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resolution proof photo is required'
      });
    }

    const complaint = await Complaint.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Complaint is not assigned to you' });
    }

    const check = canTransitionStatus({
      currentStatus: complaint.status,
      newStatus: 'resolved',
      role: req.user.role,
      isOwner: false,
      isAssignedStaff: true
    });

    if (!check.allowed) {
      return res.status(400).json({ success: false, message: check.message });
    }

    const resolutionImageUrl = getFileUrl(req, req.file.filename);

    complaint.status = 'resolved';
    complaint.resolutionImage = resolutionImageUrl;
    complaint.resolutionNote = resolutionNote || 'Cleaning work completed successfully';
    complaint.resolvedAt = new Date();

    complaint.statusHistory.push({
      status: 'resolved',
      changedBy: req.user._id,
      note: resolutionNote || 'Proof of cleaning uploaded & marked resolved',
      changedAt: new Date()
    });

    await complaint.save();

    // Award +10 points to ASSIGNED STAFF for successfully resolving the task
    await awardPoints(req.user._id, 10, `Resolved waste cleaning task ${complaint.complaintId}`, {
      referenceType: 'complaint',
      referenceId: complaint._id,
      rewardType: 'task_resolved'
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'RESOLVE_COMPLAINT',
      entityType: 'Complaint',
      entityId: complaint._id.toString(),
      details: { complaintId: complaint.complaintId, resolutionNote }
    });

    await createNotification({
      userId: complaint.userId,
      title: 'Complaint Resolved! 🎉',
      message: `Your complaint ${complaint.complaintId} has been resolved by staff. Please view proof photo and confirm verification!`,
      type: 'success'
    });

    if (ioInstance) {
      ioInstance.to(`user:${complaint.userId.toString()}`).emit('complaintResolved', complaint);
      ioInstance.to('role:admin').emit('complaintResolved', complaint);
    }

    res.status(200).json({
      success: true,
      message: 'Complaint marked as resolved with proof photo uploaded',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setSocketIO,
  getAssignedComplaints,
  getStaffStats,
  acceptComplaint,
  submitResolutionProof
};
