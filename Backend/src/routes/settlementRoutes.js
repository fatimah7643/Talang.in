import express from 'express';
import { getDebtRecap, simplifyDebt, markAsPaid, settleDebt } from '../controllers/settlementController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getSettledSummary } from '../controllers/settlementController.js';

const router = express.Router();

router.get('/:group_id/recap', authenticate, getDebtRecap);       // GET /api/v1/settlements/:group_id/recap
router.get('/:group_id/simplify', authenticate, simplifyDebt);    // GET /api/v1/settlements/:group_id/simplify
router.get('/:group_id/settled-summary', authenticate, getSettledSummary); // GET /api/v1/settlements/:group_id/settled-summary
router.put('/splits/:split_id/pay', authenticate, markAsPaid);    // PUT /api/v1/settlements/splits/:split_id/pay
router.put('/:group_id/settle', authenticate, settleDebt); // PUT /api/v1/settlements/:group_id/settle

export default router;