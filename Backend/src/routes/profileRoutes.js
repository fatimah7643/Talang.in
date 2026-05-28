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

router.get('/me',                  authenticate, getProfile);       // GET /api/v1/profiles/:profile_id
router.put('/me',                  authenticate, updateProfile);
router.put('/me/change-password',  authenticate, changePassword);
router.delete('/me',               authenticate, deleteAccount);
router.post(
  '/me/avatar',
  authenticate,
  uploadMiddleware,
  uploadAvatar
);


// Route dengan param — di bawah semua route /me
router.get('/:profile_id',         authenticate, getProfile);           // GET  /api/v1/profiles/:id
router.put('/:profile_id',         authenticate, updateProfile);        // PUT  /api/v1/profiles/:id
router.post('/:profile_id/avatar', authenticate, uploadMiddleware, uploadAvatar); // POST /api/v1/profiles/:id/avatar

export default router;