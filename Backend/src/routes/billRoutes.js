import express from 'express';
import { splitBill, splitBillNLP, getBillHistory, getBillDetail, getBillSplits, updateBill, deleteBill } from '../controllers/billController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// PENTING: route spesifik harus di atas route dengan parameter dinamis
router.post('/split', authenticate, splitBill);                  // POST   /api/v1/bills/split
router.post('/split-nlp', authenticate, splitBillNLP);           // POST   /api/v1/bills/split-nlp
router.get('/detail/:bill_id', authenticate, getBillDetail);     // GET    /api/v1/bills/detail/:bill_id
router.get('/:group_id/history', authenticate, getBillHistory);  // GET    /api/v1/bills/:group_id/history
router.get('/:bill_id/splits', authenticate, getBillSplits);     // GET    /api/v1/bills/:bill_id/splits
router.put('/:bill_id', authenticate, updateBill);               // PUT    /api/v1/bills/:bill_id
router.delete('/:bill_id', authenticate, deleteBill);            // DELETE /api/v1/bills/:bill_id

export default router;