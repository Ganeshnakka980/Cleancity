const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegisterReq, validateLoginReq } = require('../middleware/validationMiddleware');

router.post('/register', validateRegisterReq, register);
router.post('/login', validateLoginReq, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
