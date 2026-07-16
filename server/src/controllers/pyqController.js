import mongoose from 'mongoose';
import { PYQPaper } from '../models/PYQPaper.js';
import { uploadPDF, deletePDF } from '../services/cloudinaryService.js';
import fs from 'fs/promises';

// Upload PYQ (admin only)
export const uploadPYQ = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    const {
      departmentId,
      branchId,
      sessionId,
      semester,
      subjectName,
      subjectCode,
      examType,
      year,
    } = req.body;

    // Validate required fields
    if (!departmentId || !branchId || !sessionId || !semester || !subjectName || !examType || !year) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Upload to Cloudinary
    const { cloudinaryUrl, cloudinaryPublicId, fileSize } = await uploadPDF(req.file.path, {
      subjectCode,
      examType,
    });

    // Create title
    const title = `${subjectName} ${examType} ${year}`;

    // Create PYQ document
    const pyq = await PYQPaper.create({
      title,
      subjectName,
      subjectCode: subjectCode || undefined,
      departmentId,
      branchId,
      sessionId,
      semester: parseInt(semester.toString()),
      examType,
      year: parseInt(year.toString()),
      cloudinaryUrl,
      cloudinaryPublicId,
      fileName: req.file.originalname,
      fileSize,
      uploadedBy: req.user.id,
      verified: false,
      isActive: true,
    });

    res.status(201).json({ success: true, data: pyq });
  } catch (error) {
    console.error('Upload PYQ error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};

// Get filtered PYQs (public)
export const getPYQs = async (req, res) => {
  try {
    const { departmentId, branchId, sessionId, semester, examType, subjectCode, search } = req.query;

    const escapeRegex = (string) => {
      if (typeof string !== 'string') return '';
      return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    // Build dynamic filter
    const filter = { verified: true, isActive: true };
    if (departmentId) filter.departmentId = departmentId;
    if (branchId) filter.branchId = branchId;
    if (sessionId) filter.sessionId = sessionId;
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;
    
    if (subjectCode) {
      filter.subjectCode = new RegExp(escapeRegex(subjectCode), 'i');
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { subjectName: new RegExp(escapedSearch, 'i') },
        { subjectCode: new RegExp(escapedSearch, 'i') }
      ];
    }

    const pyqs = await PYQPaper.find(filter, { cloudinaryUrl: 0, cloudinaryPublicId: 0 })
      .populate('departmentId', 'name displayName icon')
      .populate('branchId', 'name')
      .populate('sessionId', 'name startYear endYear')
      .populate('uploadedBy', 'name email picture')
      .sort({ year: -1, downloads: -1 })
      .limit(100);

    res.json({ success: true, count: pyqs.length, data: pyqs });
  } catch (error) {
    console.error('Get PYQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all PYQs (admin only)
export const getAllPYQs = async (req, res) => {
  try {
    const { page = '1', limit = '100' } = req.query;
    const pageNum = Math.max(parseInt(page.toString(), 10) || 1, 1);
    // allow client to request a larger page size but cap it to avoid excessive load
    const pageSize = Math.min(Math.max(parseInt(limit.toString(), 10) || 100, 1), 1000);

    const skip = (pageNum - 1) * pageSize;

    // Filter to only show active papers
    const filter = { isActive: true };

    const [total, papers] = await Promise.all([
      PYQPaper.countDocuments(filter),
      PYQPaper.find(filter)
        .populate('departmentId', 'name displayName')
        .populate('branchId', 'name')
        .populate('sessionId', 'name')
        .populate('uploadedBy', 'name email picture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
    ]);

    res.json({ success: true, count: papers.length, total, page: pageNum, pageSize, data: papers });
  } catch (error) {
    console.error('Get all PYQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Track download
export const trackDownload = async (req, res) => {
  try {
    const { id } = req.params;

    const pyq = await PYQPaper.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true });

    if (!pyq) {
      res.status(404).json({ success: false, message: 'PYQ not found' });
      return;
    }

    res.json({ success: true, downloads: pyq.downloads });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Track view
export const trackView = async (req, res) => {
  try {
    const { id } = req.params;

    const pyq = await PYQPaper.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });

    if (!pyq) {
      res.status(404).json({ success: false, message: 'PYQ not found' });
      return;
    }

    res.json({ success: true, views: pyq.views });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify PYQ (super admin only)
export const verifyPYQ = async (req, res) => {
  try {
    const { id } = req.params;

    const pyq = await PYQPaper.findByIdAndUpdate(
      id, 
      { $set: { verified: true } }, 
      { new: true }
    ).populate('departmentId', 'name displayName')
      .populate('branchId', 'name')
      .populate('sessionId', 'name');

    if (!pyq) {
      res.status(404).json({ success: false, message: 'PYQ not found' });
      return;
    }

    res.json({ success: true, data: pyq });
  } catch (error) {
    console.error('Verify PYQ error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// Delete PYQ (admin only)
export const deletePYQ = async (req, res) => {
  try {
    const { id } = req.params;

    const pyq = await PYQPaper.findById(id);

    if (!pyq) {
      res.status(404).json({ success: false, message: 'PYQ not found' });
      return;
    }

    // Delete from Cloudinary (with error handling inside the service)
    if (pyq.cloudinaryPublicId) {
      await deletePDF(pyq.cloudinaryPublicId);
    }

    // Soft delete from database
    pyq.isActive = false;
    await pyq.save();

    res.json({ success: true, message: 'PYQ deleted successfully' });
  } catch (error) {
    console.error('Delete PYQ error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete paper' });
  }
};

// Update PYQ metadata (admin only)
export const updatePYQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectName, subjectCode, year, examType, semester } = req.body;

    const pyq = await PYQPaper.findById(id);

    if (!pyq) {
      res.status(404).json({ success: false, message: 'PYQ not found' });
      return;
    }

    // Update allowed fields
    if (subjectName) pyq.subjectName = subjectName;
    if (subjectCode) pyq.subjectCode = subjectCode;
    if (year) pyq.year = parseInt(year);
    if (examType) pyq.examType = examType;
    if (semester) pyq.semester = parseInt(semester);

    // Update title based on new data
    pyq.title = `${pyq.subjectName} ${pyq.examType} ${pyq.year}`;

    await pyq.save();

    const updated = await PYQPaper.findById(id)
      .populate('departmentId', 'name displayName')
      .populate('branchId', 'name')
      .populate('sessionId', 'name')
      .populate('uploadedBy', 'name email picture');

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update PYQ error:', error);
    res.status(500).json({ success: false, message: 'Failed to update paper' });
  }
};

// Public upload PYQ (Any authenticated student user, limit 10 per day)
export const uploadPYQPublic = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    // Rate Limit: 10 uploads per day per user (only applies to students)
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      // Calculate start of day in Indian Standard Time (IST, UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const startOfDayIST = new Date(now.getTime() + istOffset);
      startOfDayIST.setUTCHours(0, 0, 0, 0);
      const startOfDayUTC = new Date(startOfDayIST.getTime() - istOffset);

      const uploadCount = await PYQPaper.countDocuments({
        uploadedBy: new mongoose.Types.ObjectId(req.user.id),
        createdAt: { $gte: startOfDayUTC },
      });

      if (uploadCount >= 10) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('Error deleting local file after rate limit hit:', err);
        }
        res.status(429).json({
          success: false,
          message: 'Daily upload limit reached. You can upload up to 10 PYQs per day.',
        });
        return;
      }
    }

    const {
      departmentId,
      branchId,
      sessionId,
      semester,
      subjectName,
      subjectCode,
      examType,
      year,
    } = req.body;

    // Validate required fields
    if (!departmentId || !branchId || !sessionId || !semester || !subjectName || !examType || !year) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Upload to Cloudinary
    const { cloudinaryUrl, cloudinaryPublicId, fileSize } = await uploadPDF(req.file.path, {
      subjectCode,
      examType,
    });

    // Create title
    const title = `${subjectName} ${examType} ${year}`;

    // Create PYQ document (verified defaults to false, so it awaits admin verification)
    const pyq = await PYQPaper.create({
      title,
      subjectName,
      subjectCode: subjectCode || undefined,
      departmentId,
      branchId,
      sessionId,
      semester: parseInt(semester.toString()),
      examType,
      year: parseInt(year.toString()),
      cloudinaryUrl,
      cloudinaryPublicId,
      fileName: req.file.originalname,
      fileSize,
      uploadedBy: req.user.id,
      verified: false,
      isActive: true,
    });

    res.status(201).json({ success: true, data: pyq });
  } catch (error) {
    console.error('Public Upload PYQ error:', error);
    // Cleanup local file on error if not already cleaned up
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};

// Get daily upload count for the authenticated user (IST-aligned)
export const getDailyUploadCount = async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'super-admin') {
      res.json({ 
        success: true, 
        data: {
          count: 0, 
          limit: 10,
          isExempt: true 
        }
      });
      return;
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const startOfDayIST = new Date(now.getTime() + istOffset);
    startOfDayIST.setUTCHours(0, 0, 0, 0);
    const startOfDayUTC = new Date(startOfDayIST.getTime() - istOffset);

    const count = await PYQPaper.countDocuments({
      uploadedBy: new mongoose.Types.ObjectId(req.user.id),
      createdAt: { $gte: startOfDayUTC },
    });

    res.json({ 
      success: true, 
      data: {
        count, 
        limit: 10, 
        isExempt: false 
      }
    });
  } catch (error) {
    console.error('Get daily upload count error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving upload count' });
  }
};
