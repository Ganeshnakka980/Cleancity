const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');
const { getWasteHotspots } = require('../services/hotspotService');
const { createNotification } = require('../services/notificationService');
const { isValidTransition } = require('../utils/statusTransitions');
const { isValidObjectId } = require('../utils/validators');

let ioInstance = null;
const setSocketIO = (io) => {
  ioInstance = io;
};

// High-level System Statistics
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalComplaints,
      pending,
      assigned,
      inProgress,
      resolved,
      verified,
      highPriority,
      totalCitizens,
      totalStaff
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'assigned' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'verified' }),
      Complaint.countDocuments({ priority: { $in: ['high', 'critical'] } }),
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'staff' })
    ]);

    const resolutionRate = totalComplaints > 0 ? Math.round(((resolved + verified) / totalComplaints) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        pending,
        assigned,
        inProgress,
        resolved,
        verified,
        highPriority,
        totalCitizens,
        totalStaff,
        resolutionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Advanced Aggregation Analytics
const getAnalytics = async (req, res, next) => {
  try {
    // 1. Status Distribution
    const statusDistribution = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 2. Category Breakdown
    const categoryBreakdown = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Monthly Complaint Trends
    const monthlyTrends = await Complaint.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'verified']] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 4. Average Resolution Time calculation (in hours)
    const avgResolutionTimeResult = await Complaint.aggregate([
      {
        $match: {
          resolvedAt: { $ne: null }
        }
      },
      {
        $project: {
          durationHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$durationHours' }
        }
      }
    ]);

    const avgResolutionHours = avgResolutionTimeResult.length > 0 ? Math.round(avgResolutionTimeResult[0].avgHours * 10) / 10 : 0;

    // 5. Staff Performance Leaderboard
    const staffPerformance = await User.aggregate([
      { $match: { role: 'staff' } },
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'assignedTasks'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          totalAssigned: { $size: '$assignedTasks' },
          resolvedCount: {
            $size: {
              $filter: {
                input: '$assignedTasks',
                as: 'task',
                cond: { $in: ['$$task.status', ['resolved', 'verified']] }
              }
            }
          },
          inProgressCount: {
            $size: {
              $filter: {
                input: '$assignedTasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'in_progress'] }
              }
            }
          }
        }
      },
      { $sort: { resolvedCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusDistribution,
        categoryBreakdown,
        monthlyTrends,
        avgResolutionHours,
        staffPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Waste Hotspots API
const getHotspots = async (req, res, next) => {
  try {
    const hotspots = await getWasteHotspots(500, 3);
    res.status(200).json({
      success: true,
      count: hotspots.length,
      data: hotspots
    });
  } catch (error) {
    next(error);
  }
};

// Manage Users (Citizens & Staff)
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page, limit } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

// Enable/Disable User Account
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot disable administrative accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: user.isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, name: user.name }
    });

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been ${user.isActive ? 'enabled' : 'disabled'}.`,
      data: { _id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    next(error);
  }
};

// Create new Staff member
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const staffUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'staff',
      isActive: true
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_STAFF',
      entityType: 'User',
      entityId: staffUser._id.toString(),
      details: { email: staffUser.email, name: staffUser.name }
    });

    res.status(201).json({
      success: true,
      message: 'Staff member account created successfully',
      data: {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        role: staffUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get List of Active Staff for Assignment
const getStaffList = async (req, res, next) => {
  try {
    const staffMembers = await User.find({ role: 'staff', isActive: true }).select('name email phone');
    res.status(200).json({
      success: true,
      data: staffMembers
    });
  } catch (error) {
    next(error);
  }
};

// Assign Complaint to Staff Member
const assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid Complaint ID or Staff ID' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const staff = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Active staff member not found' });
    }

    if (complaint.status === 'pending') {
      if (!isValidTransition('pending', 'assigned')) {
        return res.status(400).json({ success: false, message: 'Invalid status transition' });
      }
      complaint.status = 'assigned';
    }

    complaint.assignedTo = staff._id;
    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      note: `Assigned to municipal staff: ${staff.name}`,
      changedAt: new Date()
    });

    await complaint.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ASSIGN_COMPLAINT',
      entityType: 'Complaint',
      entityId: complaint._id.toString(),
      details: { complaintId: complaint.complaintId, staffName: staff.name, staffId: staff._id }
    });

    // Notify Staff Member
    await createNotification({
      userId: staff._id,
      title: 'New Complaint Assignment 🚨',
      message: `You have been assigned complaint ${complaint.complaintId} (${complaint.category}) at ${complaint.address || 'location'}.`,
      type: 'warning'
    });

    // Notify Citizen
    await createNotification({
      userId: complaint.userId,
      title: 'Staff Assigned',
      message: `Your complaint ${complaint.complaintId} has been assigned to municipal staff (${staff.name}).`,
      type: 'info'
    });

    // Socket.IO emission
    if (ioInstance) {
      ioInstance.to(`user:${staff._id.toString()}`).emit('complaintAssigned', complaint);
      ioInstance.to(`user:${complaint.userId.toString()}`).emit('complaintStatusUpdated', complaint);
    }

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} assigned to ${staff.name}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Change Complaint Priority
const updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(', ')}`
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const oldPriority = complaint.priority;
    complaint.priority = priority;
    await complaint.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'CHANGE_PRIORITY',
      entityType: 'Complaint',
      entityId: complaint._id.toString(),
      details: { complaintId: complaint.complaintId, from: oldPriority, to: priority }
    });

    res.status(200).json({
      success: true,
      message: `Priority for ${complaint.complaintId} updated to ${priority.toUpperCase()}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Get System Feedback List
const getFeedbackList = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('userId', 'name email')
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

// Get Audit Logs
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name role email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setSocketIO,
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
};
