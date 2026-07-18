import { Department } from '../models/Department.js';
import { Branch } from '../models/Branch.js';

// Get single department by ID (public)
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department || !department.isActive) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }
    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all departments (public)
export const getDepartments = async (_req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create department (admin only)
export const createDepartment = async (req, res) => {
  try {
    const { id, name, displayName, icon, description } = req.body;

    if (!id || !name || !displayName || !description) {
      const missing = [];
      if (!id) missing.push('id');
      if (!name) missing.push('name');
      if (!displayName) missing.push('displayName');
      if (!description) missing.push('description');
      
      res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
      return;
    }

    const exists = await Department.findOne({ id });
    if (exists) {
      res.status(400).json({ success: false, message: 'Department with this ID already exists' });
      return;
    }

    const department = await Department.create({
      id,
      name,
      displayName,
      icon: icon || '🎓',
      description,
      isActive: true,
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update department (admin only)
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const department = await Department.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete department (admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    const department = await Department.findOneAndUpdate(
      { id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get branches by department (public)
export const getBranchesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const branches = await Branch.find({ departmentId, isActive: true }).sort({ name: 1 });

    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Get branches by department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
