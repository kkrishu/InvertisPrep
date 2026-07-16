import { Router } from 'express';
import { viewPDF } from '../controllers/pdfController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Protected route to view PDF with watermark
router.get('/view/:id', authenticateJWT, viewPDF);

export default router;
