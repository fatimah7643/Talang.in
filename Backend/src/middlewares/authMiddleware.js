import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Middleware: Verifikasi JWT Bearer Token dari header Authorization.
 * Jika valid, user object disimpan di req.user untuk dipakai controller berikutnya.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token tidak ditemukan di header Authorization!"
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifikasi token ke Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah kadaluwarsa. Silakan login ulang!"
      });
    }

    // Simpan user ke req agar bisa diakses di controller
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};