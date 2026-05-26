import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan.'));
  }
});
 
export const uploadMiddleware = upload.single('avatar');

// GET /api/v1/profiles/:profile_id
export const getProfile = async (req, res) => {
  try {
    const { profile_id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: "Profil tidak ditemukan!" });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile ---- PUT /api/v1/profiles/:profile_id-----//

export const updateProfile = async (req, res) => {
  try {
    const { profile_id } = req.params;
    const { full_name, username, avatar_url } = req.body;

    if (req.user.id !== profile_id) {
      return res.status(403).json({
        success: false,
        message: "Kamu tidak punya akses untuk mengubah profil ini!"
      });
    }

    if (!full_name && !username && !avatar_url) {
      return res.status(400).json({
        success: false,
        message: "Minimal satu field (full_name, username, atau avatar_url) harus diisi!"
      });
    }

    const updatePayload = {};
    if (full_name)   updatePayload.full_name   = full_name;
    if (username)    updatePayload.username    = username;
    if (avatar_url)  updatePayload.avatar_url  = avatar_url;

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profile_id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui!",
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/profiles/:profile_id/avatar
export const uploadAvatar = async (req, res) => {
  try {
    const { profile_id } = req.params;
 
    if (req.user.id !== profile_id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
 
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
    }
 
    const ext  = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const path = `${profile_id}/avatar.${ext}`;
 
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
 
    if (uploadError) throw uploadError;
 
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
 
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
 
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile_id)
      .select()
      .single();
 
    if (error) throw error;
 
    return res.status(200).json({
      success: true,
      message: 'Foto profil berhasil diupload!',
      avatar_url: avatarUrl,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/profiles/me
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    return res.status(200).json({
      success: true,
      message: "Akun berhasil dihapus."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};