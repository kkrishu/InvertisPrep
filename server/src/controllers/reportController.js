import { Report } from '../models/Report.js';
import { PYQPaper } from '../models/PYQPaper.js';

// Create a new report on a paper
export const createReport = async (req, res) => {
  try {
    const { paperId, reason, description } = req.body;
    const userId = req.user.id;

    if (!paperId || !reason) {
      res.status(400).json({ success: false, message: 'Paper ID and reason are required' });
      return;
    }

    // Verify paper exists
    const paper = await PYQPaper.findById(paperId);
    if (!paper) {
      res.status(404).json({ success: false, message: 'PYQ paper not found' });
      return;
    }

    try {
      const report = await Report.create({
        paperId,
        reportedBy: userId,
        reason,
        description,
      });

      res.status(201).json({ success: true, data: report });
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).json({ success: false, message: 'You have already reported this paper' });
        return;
      }
      throw err;
    }
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Server error during reporting' });
  }
};

// Get all reports (Admin only)
export const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate({
        path: 'paperId',
        select: 'title subjectName subjectCode departmentId branchId semester sessionId examType year uploadedBy',
        populate: [
          { path: 'departmentId', select: 'displayName name' },
          { path: 'branchId', select: 'name' },
          { path: 'sessionId', select: 'name' },
          { path: 'uploadedBy', select: 'name email' }
        ]
      })
      .populate('reportedBy', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving reports' });
  }
};

// Update report status (Admin only)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    report.status = status;
    await report.save();

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating report status' });
  }
};
