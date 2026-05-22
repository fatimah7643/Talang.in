import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// POST /api/v1/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, username, full_name } = req.body;

    if (!email || !password || !username || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, username, dan full_name wajib diisi!"
      });
    }

    // 1. Daftarkan user ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Simpan profil sekunder ke tabel profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, username, full_name }])
      .select();

    if (profileError) throw profileError;

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil! Silakan login. 🎉",
      data: {
        user_id: userId,
        email: authData.user.email,
        username,
        full_name
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi!"
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ success: false, message: "Email atau password salah!" });
    }

    return res.status(200).json({
      success: true,
      message: "Login berhasil! 🔓",
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};