import mongoose, { Schema } from 'mongoose';

const linkSchema = new Schema({
  label: { type: String, trim: true, default: '' },
  url: { type: String, trim: true, default: '' },
}, { _id: true });

const educationSchema = new Schema({
  institution: { type: String, trim: true, default: '' },
  degree: { type: String, trim: true, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
}, { _id: true });

const experienceSchema = new Schema({
  company: { type: String, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  achievements: { type: [String], default: [] },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
}, { _id: true });

const projectSchema = new Schema({
  name: { type: String, trim: true, default: '' },
  url: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  achievements: { type: [String], default: [] },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
}, { _id: true });

const skillGroupSchema = new Schema({
  title: { type: String, trim: true, default: '' },
  items: { type: [String], default: [] },
}, { _id: true });

const resumeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, default: 'My Resume', maxlength: 100 },
  personal: {
    name: { type: String, trim: true, default: '' },
    headline: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    links: { type: [linkSchema], default: [] },
  },
  summary: { type: String, trim: true, default: '' },
  education: { type: [educationSchema], default: [] },
  experience: { type: [experienceSchema], default: [] },
  projects: { type: [projectSchema], default: [] },
  skillGroups: { type: [skillGroupSchema], default: [] },
  achievements: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
}, { timestamps: true, minimize: false });

resumeSchema.index({ userId: 1, updatedAt: -1 });

export const Resume = mongoose.model('Resume', resumeSchema);
