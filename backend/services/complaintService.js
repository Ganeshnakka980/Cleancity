const Complaint = require('../models/Complaint');

const checkDuplicateComplaint = async ({ category, longitude, latitude, radiusMeters = 100 }) => {
  try {
    const activeStatuses = ['pending', 'assigned', 'in_progress'];
    
    // Find active complaints within radiusMeters with matching/similar category
    const duplicates = await Complaint.find({
      category: category,
      status: { $in: activeStatuses },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radiusMeters
        }
      }
    }).populate('userId', 'name email');

    if (duplicates && duplicates.length > 0) {
      return {
        isDuplicate: true,
        existingComplaint: duplicates[0]
      };
    }

    return {
      isDuplicate: false,
      existingComplaint: null
    };
  } catch (error) {
    console.error(`[Duplicate Detection Warning] ${error.message}`);
    return { isDuplicate: false, existingComplaint: null };
  }
};

const getPaginatedComplaints = async (filter = {}, page = 1, limit = 20) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('statusHistory.changedBy', 'name role'),
    Complaint.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    complaints,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1
    }
  };
};

module.exports = {
  checkDuplicateComplaint,
  getPaginatedComplaints
};
