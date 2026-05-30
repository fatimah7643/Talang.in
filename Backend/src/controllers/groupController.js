import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// POST /api/v1/groups/create
export const createGroup = async (req, res) => {
  try {
    const { group_name } = req.body;
    const user_id = req.user.id; // ambil dari JWT, bukan req.body

    if (!group_name) {
      return res.status(400).json({
        success: false,
        message: "Nama grup wajib diisi!"
      });
    }

    // 1. Buat grup baru
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert([{ group_name, created_by: user_id }])
      .select();

    if (groupError) throw groupError;

    const newGroup = groupData[0];

    // 2. Otomatis tambahkan pembuat sebagai anggota pertama grup
    const { error: memberError } = await supabase
      .from('group_members')
      .insert([{ group_id: newGroup.id, profile_id: user_id, role: 'admin' }]);

    if (memberError) throw memberError;

    // 3. Inisialisasi baris kosong di tabel group_analytics
    const { error: analyticsError } = await supabase
      .from('group_analytics')
      .insert([{ group_id: newGroup.id, total_spending: 0, member_count: 1 }]);

    // Analytics error tidak fatal, cukup log saja
    if (analyticsError) {
      console.warn("Gagal inisialisasi group_analytics:", analyticsError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Grup berhasil dibuat! 🎉",
      data: newGroup
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/groups/add-member
export const addMember = async (req, res) => {
  try {
    const { group_id, profile_id } = req.body;

    if (!group_id || !profile_id) {
      return res.status(400).json({
        success: false,
        message: "group_id dan profile_id wajib diisi!"
      });
    }

    // Cek apakah anggota sudah ada di grup
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('profile_id', profile_id)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Anggota ini sudah terdaftar dalam grup!"
      });
    }

    const { data, error } = await supabase
      .from('group_members')
      .insert([{ group_id, profile_id, role: 'member' }])
      .select();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Anggota berhasil ditambahkan ke grup! 👋",
      data: data[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/groups/:group_id/members
export const getMembers = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        id,
        role,
        joined_at,
        profiles (
          id,
          username,
          full_name
        )
      `)
      .eq('group_id', group_id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Daftar anggota grup berhasil dimuat.",
      group_id,
      total_members: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/groups/:group_id/members/:profile_id
export const removeMember = async (req, res) => {
  try {
    const { group_id, profile_id } = req.params;

    // Cek apakah anggota ada di grup
    const { data: existing, error: findError } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', group_id)
      .eq('profile_id', profile_id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Anggota tidak ditemukan dalam grup ini!"
      });
    }

    // Admin tidak boleh dihapus dari grup
    if (existing.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: "Admin grup tidak dapat dikeluarkan dari grup!"
      });
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('profile_id', profile_id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Anggota berhasil dikeluarkan dari grup."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/groups/:group_id
export const deleteGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const user_id = req.user.id;

    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('profile_id', user_id)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ success: false, message: 'Kamu bukan anggota grup ini!' });
    }

    if (member.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya admin yang bisa menghapus grup!' });
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', group_id);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Grup berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/groups
export const getAllGroups = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Ambil semua grup_id yang user ini ikuti sebagai member
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('profile_id', user_id);

    if (memberError) throw memberError;

    if (!memberships || memberships.length === 0) {
      return res.status(200).json({ success: true, total: 0, data: [] });
    }

    const groupIds = memberships.map(m => m.group_id);

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/groups/:group_id
export const getGroupDetail = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', group_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: "Grup tidak ditemukan!" });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/groups/my-groups
export const getGroupsByUser = async (req, res) => {
  try {
    const user_id = req.user.id; // dari JWT, bukan URL params

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role,
        joined_at,
        groups (
          id,
          group_name,
          created_at,
          member_count:group_members(count)
        )
      `)
      .eq('profile_id', user_id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      user_id,
      total_groups: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/groups/add-member-by-username
export const addMemberByUsername = async (req, res) => {
  try {
    const { group_id, username } = req.body
    if (!group_id || !username) {
      return res.status(400).json({ success: false, message: 'group_id dan username wajib diisi!' })
    }

    // Cari profile_id berdasarkan username
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (findError || !profile) {
      return res.status(404).json({ success: false, message: 'Username tidak ditemukan!' })
    }

    // Cek sudah member?
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('profile_id', profile.id)
      .single()

    if (existing) {
      return res.status(400).json({ success: false, message: 'User ini sudah ada di grup!' })
    }

    const { data, error } = await supabase
      .from('group_members')
      .insert([{ group_id, profile_id: profile.id, role: 'member' }])
      .select()

    if (error) throw error

    return res.status(201).json({ success: true, message: 'Anggota berhasil ditambahkan! 👋', data: data[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
};