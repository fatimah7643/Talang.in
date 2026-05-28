import express from 'express'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '../controllers/notificationController.js'
import { authenticate } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authenticate, getNotifications)           // GET  /api/v1/notifications
router.put('/read-all', authenticate, markAllAsRead)      // PUT  /api/v1/notifications/read-all
router.put('/:id/read', authenticate, markAsRead)         // PUT  /api/v1/notifications/:id/read
router.delete('/delete-all', authenticate, deleteAllNotifications)  // DELETE /api/v1/notifications
router.delete('/:id',      authenticate, deleteNotification)     // DELETE /api/v1/notifications/:id
export default router