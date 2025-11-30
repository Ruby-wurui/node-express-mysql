const express = require('express');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const router = express.Router();

console.log('Auth router loaded');

// Load database configuration and models directly
const config = require('../config.development.js');
const sequelize = new Sequelize(
  config.db,
  config.username,
  config.password,
  config.params
);

// Load Users model directly
const Users = require('../models/users')(sequelize, Sequelize.DataTypes);

console.log('Users model loaded directly');

// Log all requests to auth routes (for debugging)
router.use((req, res, next) => {
  console.log('Auth route accessed:', req.method, req.path);
  next();
});

// Database connection is now handled directly, no middleware needed


// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user by username or email
    const user = await Users.findOne({
      where: {
        [Sequelize.Op.or]: [
          { name: username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = Users.isPassword(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'asdfsafsafsafsafsafsafsafd',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/register - User registration (public for users, admin only for admin role)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // If role is specified as 'admin', check if requester is admin
    if (role === 'admin') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required to create admin users'
        });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asdfsafsafsafsafsafsafsafd');
        if (decoded.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Only admins can create admin users'
          });
        }
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired admin token'
        });
      }
    }

    // Check if user already exists
    const existingUser = await Users.findOne({
      where: {
        [Sequelize.Op.or]: [
          { name },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this name or email already exists'
      });
    }

    // Create new user (default to 'user' role if not specified or not authorized for admin)
    const newUser = await Users.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || 'asdfsafsafsafsafsafsafsafd',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/me - Get current user info (simplified version)
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asdfsafsafsafsafsafsafsafd');

    res.json({
      success: true,
      data: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('/me endpoint error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

module.exports = router;