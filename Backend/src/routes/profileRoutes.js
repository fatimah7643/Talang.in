import express from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/profileController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:profile_id', authenticate, getProfile); // GET /api/v1/profiles/:profile_id
router.delete('/me', authenticate, deleteAccount);
router.put('/:profile_id', authenticate, updateProfile);


export default router;