import express from 'express';
import { 
    getProfile, 
    updateProfile, 
    changePassword,
    deleteAccount, 
    uploadAvatar, 
    uploadMiddleware 
} from '../controllers/profileController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:profile_id', authenticate, getProfile); // GET /api/v1/profiles/:profile_id
router.put('/:profile_id', authenticate, updateProfile);
router.put('/me/change-password', authenticate, changePassword);
router.post(
  '/:profile_id/avatar',
  authenticate,
  uploadMiddleware,
  uploadAvatar
);
router.delete('/me', authenticate, deleteAccount);

export default router;