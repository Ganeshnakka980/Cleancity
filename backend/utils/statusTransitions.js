const allowedTransitions = {
  pending: ['assigned', 'rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['resolved'],
  resolved: ['verified', 'rejected'],
  verified: [],
  rejected: []
};

const canTransitionStatus = ({ currentStatus, newStatus, role, isOwner, isAssignedStaff }) => {
  if (currentStatus === newStatus) return { allowed: true };

  const validNextStatuses = allowedTransitions[currentStatus] || [];
  if (!validNextStatuses.includes(newStatus)) {
    return {
      allowed: false,
      message: `Invalid state transition from '${currentStatus}' to '${newStatus}'`
    };
  }

  // Role-based authorization rules for state transitions
  if (currentStatus === 'pending' && newStatus === 'assigned') {
    if (role !== 'admin') {
      return { allowed: false, message: 'Only administrators can assign pending complaints' };
    }
  }

  if (currentStatus === 'pending' && newStatus === 'rejected') {
    if (role !== 'admin') {
      return { allowed: false, message: 'Only administrators can reject complaints' };
    }
  }

  if (currentStatus === 'assigned' && newStatus === 'in_progress') {
    if (role !== 'admin' && !isAssignedStaff) {
      return { allowed: false, message: 'Only the assigned staff member can start work on this complaint' };
    }
  }

  if (currentStatus === 'assigned' && newStatus === 'rejected') {
    if (role !== 'admin') {
      return { allowed: false, message: 'Only administrators can reject assigned complaints' };
    }
  }

  if (currentStatus === 'in_progress' && newStatus === 'resolved') {
    if (role !== 'admin' && !isAssignedStaff) {
      return { allowed: false, message: 'Only the assigned staff member can mark work as resolved' };
    }
  }

  if (currentStatus === 'resolved' && newStatus === 'verified') {
    // Staff cannot verify complaints! Only citizen owner OR admin can verify.
    if (role === 'staff') {
      return { allowed: false, message: 'Municipal staff cannot verify resolutions. Verification is performed by the citizen reporter or administrator.' };
    }
    if (role !== 'admin' && !isOwner) {
      return { allowed: false, message: 'Only the citizen who reported this complaint (or an administrator) can verify resolution.' };
    }
  }

  if (currentStatus === 'resolved' && newStatus === 'rejected') {
    if (role !== 'admin') {
      return { allowed: false, message: 'Only administrators can reject resolved complaints' };
    }
  }

  return { allowed: true };
};

module.exports = {
  allowedTransitions,
  canTransitionStatus
};
