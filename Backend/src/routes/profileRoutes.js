import express from 'express';
import { getProfile } from '../controllers/profileController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:profile_id', authenticate, getProfile); // GET /api/v1/profiles/:profile_id

export default router;