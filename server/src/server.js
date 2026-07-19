import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import { connectDB } from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import dns from 'dns';
dns.setServers(["1.1.1.1", "8.8.8.8"]);


// Import routes
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import branchRoutes from './routes/branches.js';
import sessionRoutes from './routes/sessions.js';
import pyqRoutes from './routes/pyq.js';
import syllabusRoutes from './routes/syllabus.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import pdfRoutes from './routes/pdf.js';
import resumeRoutes from './routes/resumes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://172.23.6.34:3000',
  'https://invertisprep.vercel.app',
  'https://invertisprepv2.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const initApp = async () => {
  await connectDB();

  // Configure Cloudinary
  configureCloudinary();

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(morgan('dev'));
  // Resume drafts can include a deliberately small base64 profile photo.
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/pyq', pyqRoutes);
  app.use('/api/syllabus', syllabusRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/pdf', pdfRoutes);
  app.use('/api/resumes', resumeRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

initApp().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
