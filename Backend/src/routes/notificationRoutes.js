import express from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js'
import { authenticate } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authenticate, getNotifications)           // GET  /api/v1/notifications
router.put('/read-all', authenticate, markAllAsRead)      // PUT  /api/v1/notifications/read-all
router.put('/:id/read', authenticate, markAsRead)         // PUT  /api/v1/notifications/:id/read

export default router