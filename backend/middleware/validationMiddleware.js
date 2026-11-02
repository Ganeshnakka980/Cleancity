const {
  validateRegister,
  validateLogin,
  validateComplaint,
  validateFeedback
} = require('../utils/validators');

const handleValidation = (validatorFn) => {
  return (req, res, next) => {
    const errors = validatorFn(req.body);
    if (errors && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    next();
  };
};

module.exports = {
  validateRegisterReq: handleValidation(validateRegister),
  validateLoginReq: handleValidation(validateLogin),
  validateComplaintReq: handleValidation(validateComplaint),
  validateFeedbackReq: handleValidation(validateFeedback)
};
