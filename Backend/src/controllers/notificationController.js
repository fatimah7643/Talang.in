import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// GET /api/v1/notifications
export const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

// PUT /api/v1/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

// PUT /api/v1/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}