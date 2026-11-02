const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Reward = require('../models/Reward');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cleancity_super_secret_jwt_key_2026_production_hardening', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Role safety: only allow 'citizen' via public registration
    const userRole = role === 'admin' || role === 'staff' ? 'citizen' : 'citizen';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: userRole,
      points: 10
    });

    // Create initial Reward record
    await Reward.create({
      userId: user._id,
      points: 10,
      level: 'Bronze',
      history: [{ points: 10, reason: 'Welcome bonus for joining CleanCity' }]
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled. Please contact municipal administrator.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const reward = await Reward.findOne({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        reward: reward || { points: user.points, level: 'Bronze', history: [] }
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
