import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createResume, deleteResume, getResume, listResumes, updateResume } from '../controllers/resumeController.js';

const router = Router();
router.use(authenticateJWT);
router.route('/').get(listResumes).post(createResume);
router.route('/:id').get(getResume).put(updateResume).delete(deleteResume);

export default router;
