import mongoose, { Schema } from 'mongoose';

const pyqPaperSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Hierarchy
    departmentId: {
      type: String,
      required: true,
      ref: 'Department',
      index: true,
    },
    branchId: {
      type: String,
      required: true,
      ref: 'Branch',
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      ref: 'Session',
      index: true,
    },
    examType: {
      type: String,
      enum: ['mid-term', 'end-term', 'sessional'],
      required: true,
    },
    
    // File info
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    
    // Metadata
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
pyqPaperSchema.index({ departmentId: 1, branchId: 1, semester: 1, verified: 1 });
pyqPaperSchema.index({ verified: 1, isActive: 1 });
pyqPaperSchema.index({ year: -1, downloads: -1 });
// Optimized index for public listing: filter by departmentId + verified + isActive, sort by year + downloads
pyqPaperSchema.index({ departmentId: 1, verified: 1, isActive: 1, year: -1, downloads: -1 });

export const PYQPaper = mongoose.model('PYQPaper', pyqPaperSchema);
