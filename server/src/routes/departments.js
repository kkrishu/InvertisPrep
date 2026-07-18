import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getBranchesByDepartment,
} from '../controllers/departmentController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getDepartments);
router.get('/:departmentId/branches', getBranchesByDepartment);
router.get('/:id', getDepartmentById);

// Admin routes
router.post('/', authenticateJWT, isAdmin, createDepartment);
router.put('/:id', authenticateJWT, isAdmin, updateDepartment);
router.delete('/:id', authenticateJWT, isAdmin, deleteDepartment);

export default router;
