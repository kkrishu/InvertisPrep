import { Resume } from '../models/Resume.js';

const permittedFields = [
  'title', 'personal', 'summary', 'education', 'experience', 'projects',
  'skillGroups', 'achievements', 'languages', 'certifications',
];

const pickResumeFields = (body) => Object.fromEntries(
  permittedFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
);

export const listResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .select('title personal.name personal.headline updatedAt createdAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: resumes });
  } catch (error) {
    console.error('List resumes error:', error);
    res.status(500).json({ success: false, message: 'Unable to load resumes' });
  }
};

export const createResume = async (req, res) => {
  try {
    const resume = await Resume.create({ userId: req.user.id, ...pickResumeFields(req.body) });
    res.status(201).json({ success: true, data: resume });
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(400).json({ success: false, message: 'Unable to create resume' });
  }
};

export const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, data: resume });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid resume id' });
  }
};

export const updateResume = async (req, res) => {
  try {
    const updates = pickResumeFields(req.body);
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, data: resume });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(400).json({ success: false, message: 'Unable to save resume' });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid resume id' });
  }
};
