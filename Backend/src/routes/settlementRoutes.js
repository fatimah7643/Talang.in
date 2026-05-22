import express from 'express';
import { getDebtRecap, simplifyDebt, markAsPaid } from '../controllers/settlementController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:group_id/recap', authenticate, getDebtRecap);       // GET /api/v1/settlements/:group_id/recap
router.get('/:group_id/simplify', authenticate, simplifyDebt);    // GET /api/v1/settlements/:group_id/simplify
router.put('/splits/:split_id/pay', authenticate, markAsPaid);    // PUT /api/v1/settlements/splits/:split_id/pay

export default router;