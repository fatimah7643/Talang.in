import express from 'express';
import { getHealthScore, getConflicts, getConflictStatus, getDashboard } from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:group_id/health', authenticate, getHealthScore);            // GET /api/v1/analytics/:group_id/health
router.get('/:group_id/conflicts', authenticate, getConflicts);           // GET /api/v1/analytics/:group_id/conflicts
router.get('/:group_id/conflict-status', authenticate, getConflictStatus);// GET /api/v1/analytics/:group_id/conflict-status
router.get('/:group_id/dashboard', authenticate, getDashboard);           // GET /api/v1/analytics/:group_id/dashboard

export default router;