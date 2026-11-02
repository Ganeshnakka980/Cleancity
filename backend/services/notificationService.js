const Notification = require('../models/Notification');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const createNotification = async ({ userId, title, message, type = 'info' }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type
    });

    if (ioInstance) {
      // Emit to targeted user's room
      ioInstance.to(`user:${userId.toString()}`).emit('notificationCreated', notification);
    }

    return notification;
  } catch (error) {
    console.error(`[Notification Service Error] ${error.message}`);
    return null;
  }
};

module.exports = {
  setSocketIO,
  createNotification
};
