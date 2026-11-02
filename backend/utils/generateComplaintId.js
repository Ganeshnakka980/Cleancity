const Complaint = require('../models/Complaint');

const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  const prefix = `CC-${year}-`;
  
  // Find latest complaint with current year prefix
  const latestComplaint = await Complaint.findOne({
    complaintId: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let sequenceNumber = 1;
  if (latestComplaint && latestComplaint.complaintId) {
    const parts = latestComplaint.complaintId.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequenceNumber = lastSeq + 1;
      }
    }
  }

  const paddedSeq = String(sequenceNumber).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
};

module.exports = generateComplaintId;
