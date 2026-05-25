import express from 'express';
import { register, login, googleLogin, googleCallback } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register); // POST /api/v1/auth/register
router.post('/login', login);       // POST /api/v1/auth/login

// Google OAuth routes
router.get('/google', googleLogin);           // GET /api/v1/auth/google
router.get('/google/callback', googleCallback); // GET /api/v1/auth/google/callback

export default router;