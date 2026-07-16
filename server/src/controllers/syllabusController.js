import { Syllabus } from '../models/Syllabus.js';
import { uploadPDF, deletePDF } from '../services/cloudinaryService.js';

export const uploadSyllabus = async (req, res) => {
  try {
    const { name, department, year } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!name || !department || !year) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadPDF(req.file.path);

    // Save to database
    const syllabus = new Syllabus({
      name,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      department,
      year,
      cloudinaryPublicId: cloudinaryResult.cloudinaryPublicId,
      cloudinaryUrl: cloudinaryResult.cloudinaryUrl,
      uploadedBy: userId,
      isActive: true,
    });

    await syllabus.save();

    res.json({ success: true, data: syllabus });
  } catch (error) {
    console.error('Upload syllabus error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload syllabus' });
  }
};

export const getSyllabus = async (req, res) => {
  try {
    const { department, year } = req.query;
    const filter = { isActive: true };

    if (department) filter.department = department;
    if (year) filter.year = year;

    const syllabus = await Syllabus.find(filter, { cloudinaryUrl: 0, cloudinaryPublicId: 0 })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: syllabus });
  } catch (error) {
    console.error('Get syllabus error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch syllabus' });
  }
};

export const getAllSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.find({ isActive: true }, { cloudinaryUrl: 0, cloudinaryPublicId: 0 })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: syllabus, count: syllabus.length });
  } catch (error) {
    console.error('Get all syllabus error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch syllabus' });
  }
};

export const deleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params;

    const syllabus = await Syllabus.findById(id);

    if (!syllabus) {
      return res.status(404).json({ success: false, message: 'Syllabus not found' });
    }

    // Delete from Cloudinary
    if (syllabus.cloudinaryPublicId) {
      await deletePDF(syllabus.cloudinaryPublicId);
    }

    // Soft delete from database
    syllabus.isActive = false;
    await syllabus.save();

    res.json({ success: true, message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Delete syllabus error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete syllabus' });
  }
};
