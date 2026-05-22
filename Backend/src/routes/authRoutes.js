import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register); // POST /api/v1/auth/register
router.post('/login', login);       // POST /api/v1/auth/login

export default router;