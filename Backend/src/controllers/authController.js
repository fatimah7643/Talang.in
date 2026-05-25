import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      flowType: 'pkce',
    },
  }
);

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

// Login With GOOGLE
// GET /api/v1/auth/google
export const googleLogin = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Arahkan Google balik ke endpoint callback di Railway ini
        redirectTo: 'https://talangin-production.up.railway.app/api/v1/auth/google/callback',
      },
    });

    if (error) throw error;

    // Alihkan browser user ke halaman pemilihan akun Google
    return res.redirect(data.url);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/auth/google/callback
export const googleCallback = async (req, res) => {
  const { code } = req.query;

  // Jika code tidak dikirim oleh Google, balikkan ke frontend dengan pesan error
  if (!code) {
    return res.redirect('http://localhost:5173/login?error=no_code_from_google');
  }

  try {
    // Tukar kode OAuth dari Google menjadi session Supabase resmi
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const session = data.session;
    const user = data.user;

    // Cek apakah profile user ini sudah ada di tabel 'profiles'
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // SINKRONISASI OTOMATIS: Jika profil belum ada, daftarkan otomatis (fitur Register via Google)
    if (!existingProfile) {
      const rawName = user.user_metadata.full_name || user.user_metadata.name || 'Google User';
      const generatedUsername = user.email.split('@')[0] + '_' + Math.floor(1000 + Math.random() * 9000);

      await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: rawName,
          username: generatedUsername.toLowerCase()
        }]);
    }

    // Ambil data user yang diperlukan untuk dikirim ke frontend
    const userData = encodeURIComponent(JSON.stringify({ 
      id: user.id, 
      email: user.email,
    full_name: 
      user.user_metadata.full_name ||
      user.user_metadata.name ||
      'Pengguna'
    }));
    
    // Alihkan user ke frontend localhost sambil membawa token & data user di URL query
    return res.redirect(`http://localhost:5173/dashboard?token=${session.access_token}&user=${userData}`);
  } catch (error) {
    console.error("OAuth Callback Error:", error.message);
    return res.redirect('http://localhost:5173/login?error=oauth_failed');
  }
};