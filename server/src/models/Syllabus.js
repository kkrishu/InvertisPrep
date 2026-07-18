import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    fileName: String,
    fileSize: Number,
    department: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: String,
    cloudinaryUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for the public listing query: filter by isActive + sort by createdAt
syllabusSchema.index({ isActive: 1, createdAt: -1 });

export const Syllabus = mongoose.model('Syllabus', syllabusSchema);
