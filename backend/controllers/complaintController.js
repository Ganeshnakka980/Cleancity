const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');
const generateComplaintId = require('../utils/generateComplaintId');
const { reverseGeocode } = require('../services/geocodingService');
const { getFileUrl } = require('../services/uploadService');
const { awardPoints } = require('../services/rewardService');
const { createNotification } = require('../services/notificationService');
const { checkDuplicateComplaint, getPaginatedComplaints } = require('../services/complaintService');
const { canTransitionStatus } = require('../utils/statusTransitions');

let ioInstance = null;
const setSocketIO = (io) => {
  ioInstance = io;
};

// Check for duplicate complaint before submission
const checkDuplicate = async (req, res, next) => {
  try {
    const { category, latitude, longitude, radiusMeters } = req.body;
    const result = await checkDuplicateComplaint({
      category,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      radiusMeters: parseFloat(radiusMeters) || 150
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Create a new complaint
const createComplaint = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Complaint image is required'
      });
    }

    const { category, description, latitude, longitude, priority } = req.body;
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    const imageUrl = getFileUrl(req, req.file.filename);

    let address = req.body.address;
    if (!address || address.trim().length === 0) {
      address = await reverseGeocode(latNum, lngNum);
    }

    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      userId: req.user._id,
      image: imageUrl,
      category,
      description,
      location: {
        type: 'Point',
        coordinates: [lngNum, latNum] // GeoJSON: [longitude, latitude]
      },
      address,
      priority: priority && ['low', 'medium', 'high', 'critical'].includes(priority) ? priority : 'medium',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          note: 'Complaint created and reported by citizen',
          changedAt: new Date()
        }
      ]
    });

    // Award +10 EcoPoints to Citizen for reporting waste
    await awardPoints(req.user._id, 10, `Reported waste issue ${complaintId}`, {
      referenceType: 'complaint',
      referenceId: complaint._id,
      rewardType: 'report_created'
    });

    // Create Notification
    await createNotification({
      userId: req.user._id,
      title: 'Complaint Submitted',
      message: `Your complaint ${complaintId} has been successfully registered.`,
      type: 'success'
    });

    if (ioInstance) {
      ioInstance.to('role:admin').emit('complaintCreated', complaint);
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Get list of complaints with pagination & filters
const getComplaints = async (req, res, next) => {
  try {
    const { page, limit, status, category, priority, assignedTo, search, startDate, endDate } = req.query;

    const filter = { isDeleted: { $ne: true } };

    if (req.user.role === 'citizen') {
      // Citizens see public complaints or filter by status
    } else if (req.user.role === 'staff') {
      if (!assignedTo && !search) {
        filter.assignedTo = req.user._id;
      }
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const result = await getPaginatedComplaints(filter, page, limit);

    res.status(200).json({
      success: true,
      data: result.complaints,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get current citizen's complaints
const getMyComplaints = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const filter = { userId: req.user._id, isDeleted: { $ne: true } };
    if (status) filter.status = status;

    const result = await getPaginatedComplaints(filter, page, limit);

    res.status(200).json({
      success: true,
      data: result.complaints,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get single complaint details with ownership enforcement
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('statusHistory.changedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Citizen ownership check
    if (req.user.role === 'citizen' && complaint.userId._id.toString() !== req.user._id.toString()) {
      const sanitized = complaint.toObject();
      delete sanitized.userId.email;
      delete sanitized.userId.phone;
      return res.status(200).json({ success: true, data: sanitized });
    }

    const feedback = await Feedback.findOne({ complaintId: complaint._id });

    res.status(200).json({
      success: true,
      data: {
        ...complaint.toObject(),
        feedback: feedback || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get nearby complaints using MongoDB $nearSphere
const getNearbyComplaints = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude parameters are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 5;
    const radiusMeters = radiusKm * 1000;

    const complaints = await Complaint.find({
      isDeleted: { $ne: true },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusMeters
        }
      }
    })
      .limit(50)
      .populate('userId', 'name');

    const dataWithDistance = complaints.map((doc) => {
      const c = doc.toObject();
      const cLng = c.location.coordinates[0];
      const cLat = c.location.coordinates[1];
      const R = 6371000;
      const dLat = ((cLat - latitude) * Math.PI) / 180;
      const dLng = ((cLng - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((cLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const distanceMeters = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      return {
        ...c,
        distanceMeters
      };
    });

    res.status(200).json({
      success: true,
      count: dataWithDistance.length,
      data: dataWithDistance
    });
  } catch (error) {
    next(error);
  }
};

// Update status with transition & role authorization validation
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const complaint = await Complaint.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const isOwner = complaint.userId.toString() === req.user._id.toString();
    const isAssignedStaff = complaint.assignedTo?.toString() === req.user._id.toString();

    // Validate Transition & Role Authorization
    const transitionCheck = canTransitionStatus({
      currentStatus: complaint.status,
      newStatus: status,
      role: req.user.role,
      isOwner,
      isAssignedStaff
    });

    if (!transitionCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: transitionCheck.message
      });
    }

    const prevStatus = complaint.status;
    complaint.status = status;
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status changed from ${prevStatus} to ${status}`,
      changedAt: new Date()
    });

    await complaint.save();

    // Award +20 EcoPoints to CITIZEN when complaint is VERIFIED
    if (status === 'verified') {
      await awardPoints(
        complaint.userId,
        20,
        `Verified resolution of waste complaint ${complaint.complaintId}`,
        {
          referenceType: 'complaint',
          referenceId: complaint._id,
          rewardType: 'report_verified'
        }
      );
    }

    // Award +10 points to ASSIGNED STAFF when complaint is RESOLVED
    if (status === 'resolved' && complaint.assignedTo) {
      await awardPoints(
        complaint.assignedTo,
        10,
        `Successfully resolved assigned waste task ${complaint.complaintId}`,
        {
          referenceType: 'complaint',
          referenceId: complaint._id,
          rewardType: 'task_resolved'
        }
      );
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_STATUS',
      entityType: 'Complaint',
      entityId: complaint._id.toString(),
      details: { complaintId: complaint.complaintId, from: prevStatus, to: status, note }
    });

    await createNotification({
      userId: complaint.userId,
      title: `Complaint Status: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your complaint ${complaint.complaintId} is now ${status.replace('_', ' ').toUpperCase()}.`,
      type: status === 'resolved' || status === 'verified' ? 'success' : 'info'
    });

    if (ioInstance) {
      ioInstance.to(`user:${complaint.userId.toString()}`).emit('complaintStatusUpdated', complaint);
      ioInstance.to('role:admin').emit('complaintStatusUpdated', complaint);
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Soft Delete complaint (Admin only)
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.isDeleted = true;
    complaint.deletedAt = new Date();
    complaint.deletedBy = req.user._id;
    await complaint.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'SOFT_DELETE_COMPLAINT',
      entityType: 'Complaint',
      entityId: req.params.id,
      details: { complaintId: complaint.complaintId }
    });

    res.status(200).json({
      success: true,
      message: 'Complaint soft-deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setSocketIO,
  checkDuplicate,
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaintById,
  getNearbyComplaints,
  updateComplaintStatus,
  deleteComplaint
};
