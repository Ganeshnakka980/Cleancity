const mongoose = require('mongoose');

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const validateRegister = (data) => {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Valid name is required');
  }
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  return errors;
};

const validateLogin = (data) => {
  const errors = [];
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }
  return errors;
};

const validateComplaint = (data) => {
  const errors = [];
  const validCategories = [
    'General Garbage',
    'Plastic Waste',
    'Overflowing Bin',
    'Illegal Dumping',
    'Construction Waste',
    'E-Waste',
    'Organic Waste',
    'Other'
  ];

  if (!data.category || !validCategories.includes(data.category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
    errors.push('Description must be at least 5 characters long');
  }

  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Valid latitude between -90 and 90 is required');
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push('Valid longitude between -180 and 180 is required');
  }

  return errors;
};

const validateFeedback = (data) => {
  const errors = [];
  const rating = Number(data.rating);
  if (isNaN(rating) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer between 1 and 5');
  }
  if (data.comment && data.comment.length > 500) {
    errors.push('Comment must not exceed 500 characters');
  }
  return errors;
};

module.exports = {
  isValidObjectId,
  validateRegister,
  validateLogin,
  validateComplaint,
  validateFeedback
};
