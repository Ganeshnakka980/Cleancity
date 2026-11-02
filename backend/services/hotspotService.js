const Complaint = require('../models/Complaint');

const getWasteHotspots = async (radiusMeters = 500, minCount = 3) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90); // Expand to 90 days to cover demo dataset nicely

    // MongoDB aggregation pipeline to group by approximate geo grid (3 decimal places ~= 110m resolution)
    const hotspots = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'rejected' }
        }
      },
      {
        $project: {
          category: 1,
          status: 1,
          priority: 1,
          address: 1,
          longitude: { $arrayElemAt: ['$location.coordinates', 0] },
          latitude: { $arrayElemAt: ['$location.coordinates', 1] },
          gridLng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] },
          gridLat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] }
        }
      },
      {
        $group: {
          _id: { lng: '$gridLng', lat: '$gridLat' },
          complaintCount: { $sum: 1 },
          categories: { $push: '$category' },
          addresses: { $push: '$address' },
          priorities: { $push: '$priority' },
          avgLng: { $avg: '$longitude' },
          avgLat: { $avg: '$latitude' }
        }
      },
      {
        $match: {
          complaintCount: { $gte: minCount }
        }
      },
      {
        $sort: { complaintCount: -1 }
      }
    ]);

    // Process top category and sample address for each cluster
    return hotspots.map((spot) => {
      // Find most frequent category
      const categoryCounts = {};
      spot.categories.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      let topCategory = 'General Garbage';
      let maxCatCount = 0;
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count;
          topCategory = cat;
        }
      });

      const sampleAddress = spot.addresses.find((addr) => addr && addr.length > 0) || 'Metropolitan Area';

      return {
        latitude: spot.avgLat,
        longitude: spot.avgLng,
        complaintCount: spot.complaintCount,
        radius: radiusMeters,
        topCategory,
        area: sampleAddress,
        priority: spot.complaintCount >= 8 ? 'Critical' : spot.complaintCount >= 5 ? 'High' : 'Medium'
      };
    });
  } catch (error) {
    console.error(`[Hotspot Service Error] ${error.message}`);
    return [];
  }
};

module.exports = { getWasteHotspots };
