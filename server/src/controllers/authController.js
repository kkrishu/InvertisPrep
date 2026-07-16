import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyGoogleToken } from '../services/googleAuthService.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
        course: user.course || '',
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
        course: user.course || '',
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Google token is required' });
      return;
    }

    // Verify the Google token
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(token);
    } catch (tokenError) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired Google token'
      });
      return;
    }

    if (!googleUser || !googleUser.email) {
      res.status(400).json({ success: false, message: 'Invalid Google user data' });
      return;
    }

    if (!googleUser.email_verified) {
      res.status(400).json({ success: false, message: 'Email not verified with Google' });
      return;
    }

    // Check if user exists and handle concurrency with proper error handling
    let user;
    try {
      user = await User.findOne({ email: googleUser.email });

      // If user doesn't exist, create a new student account
      if (!user) {
        user = await User.create({
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name || 'User',
          picture: googleUser.picture || null,
          role: 'student', // Default role for Google OAuth users
          isActive: true,
          lastLogin: new Date(),
        });
      } else if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Your account has been disabled' });
        return;
      } else {
        // Update last login, picture, and googleId if not set
        user.lastLogin = new Date();
        if (googleUser.picture) {
          user.picture = googleUser.picture;
        }
        if (!user.googleId && googleUser.sub) {
          user.googleId = googleUser.sub;
        }
        await user.save();
      }
    } catch (dbError) {
      if (dbError.code === 11000) {
        // Duplicate key error - race condition where user was created between find and create
        user = await User.findOne({ email: googleUser.email });
        if (user) {
          user.lastLogin = new Date();
          if (!user.googleId && googleUser.sub) {
            user.googleId = googleUser.sub;
          }
          await user.save();
        } else {
          throw dbError;
        }
      } else {
        throw dbError;
      }
    }

    if (!user) {
      res.status(500).json({ success: false, message: 'Failed to create or retrieve user' });
      return;
    }

    // Generate JWT
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
        course: user.course || '',
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      message: 'Server error during Google login',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const logout = (_req, res) => {
  // Logout is typically handled on the client side by removing the token
  res.json({ success: true, message: 'Logged out successfully' });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, studentId, phoneNumber, course } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name !== undefined) user.name = name;
    if (studentId !== undefined) user.studentId = studentId;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (course !== undefined) user.course = course;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
        course: user.course || '',
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};
