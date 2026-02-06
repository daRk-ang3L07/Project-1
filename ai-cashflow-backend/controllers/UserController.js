const { User } = require('../models');
const bcrypt = require('bcryptjs');

class UserController {
  // Create a new user (business owner)
  static async createUser(req, res) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        companyName
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user (password will be hashed by model hook)
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        companyName
      });

      // Don't return password in response
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        isActive: user.isActive,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all users (for testing/admin purposes)
  static async getUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] }, // Don't return passwords
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single user by ID
  static async getUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // If password is being updated, hash it
      if (req.body.password) {
        const saltRounds = 10;
        req.body.password = await bcrypt.hash(req.body.password, saltRounds);
      }

      await user.update(req.body);

      // Don't return password in response
      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.destroy();

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Login user
  static async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Compare password (assuming you have a method in User model or use bcrypt directly)
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET || 'fallback-secret', 
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName
          },
          token
        },
        message: 'Login successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = UserController;