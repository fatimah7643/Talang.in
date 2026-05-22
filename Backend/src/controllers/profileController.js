import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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