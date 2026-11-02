const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error Middleware] ${err.name || 'Error'}: ${err.message}`);
  }

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with ID of ${err.value}`;
    return res.status(404).json({
      success: false,
      message
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Multer & File Upload Errors (file type, size limit, unexpected field) -> HTTP 400
  if (
    err.name === 'MulterError' ||
    err.code === 'LIMIT_FILE_SIZE' ||
    err.code === 'LIMIT_UNEXPECTED_FILE' ||
    err.statusCode === 400 ||
    (err.message && err.message.includes('image files are allowed'))
  ) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size limit exceeded. Maximum allowed size is 5MB.'
        : err.message || 'File upload validation failed';

    return res.status(400).json({
      success: false,
      message
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token'
    });
  }

  // Default Error Response
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFound
};
