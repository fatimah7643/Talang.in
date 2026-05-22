import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const logActivity = async (group_id, actor_id, action_type, description, metadata = {}) => {
  try {
    await supabase.from('activity_logs').insert([{
      group_id, actor_id, action_type, description, metadata
    }]);
  } catch (err) {
    console.warn("Gagal mencatat activity_log:", err.message);
  }
};

// POST /api/v1/bills/split
export const splitBill = async (req, res) => {
  try {
    const { group_id, payer_id, amount, description, category, splits } = req.body;

    if (!group_id || !payer_id || !amount || !description || !splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "group_id, payer_id, amount, description, dan splits (array) wajib diisi!"
      });
    }

    const totalSplits = splits.reduce((sum, s) => sum + Number(s.share_amount), 0);
    if (Math.abs(totalSplits - Number(amount)) > 1) {
      return res.status(400).json({
        success: false,
        message: `Total split (${totalSplits}) tidak sesuai dengan total amount (${amount})!`
      });
    }

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{ group_id, payer_id, amount: Number(amount), description, category: category || 'Lainnya' }])
      .select();

    if (billError) throw billError;

    const bill = billData[0];

    const splitRows = splits.map(s => ({
      bill_id: bill.id,
      member_id: s.member_id,
      share_amount: Number(s.share_amount),
      amount_paid: 0,
      is_paid: false
    }));

    const { data: splitData, error: splitError } = await supabase
      .from('bill_splits')
      .insert(splitRows)
      .select();

    if (splitError) throw splitError;

    await logActivity(
      group_id, payer_id, 'BILL_CREATED',
      `Tagihan baru: "${description}" sebesar Rp${Number(amount).toLocaleString()} dibagi ke ${splits.length} anggota.`,
      { bill_id: bill.id, amount, category, split_count: splits.length }
    );

    return res.status(201).json({
      success: true,
      message: "Tagihan berhasil dicatat dan dibagi!",
      bill_summary: bill,
      split_details: splitData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/bills/split-nlp
export const splitBillNLP = async (req, res) => {
  try {
    const { group_id, raw_text, group_members, custom_splits } = req.body;
 
    if (!group_id || !raw_text || !group_members || !Array.isArray(group_members)) {
      return res.status(400).json({
        success: false,
        message: "group_id, raw_text, dan group_members (array nama) wajib diisi!"
      });
    }
 
    // 1. Kirim ke AI model
    const aiResponse = await fetch(`${process.env.AI_BASE_URL}/parse-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: raw_text,
        group_members
      })
    });
 
    if (!aiResponse.ok) {
      throw new Error("AI service tidak merespons dengan benar.");
    }
 
    const aiResult = await aiResponse.json();
 
    if (aiResult.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: "AI gagal memproses teks transaksi.",
        ai_response: aiResult
      });
    }
 
    // ── WORKAROUND 1: Case-insensitive matching untuk paidBy ──────────────────
    // AI kadang return nama dengan casing berbeda dari group_members
    // Contoh: AI return "risna a" padahal di group_members "Risna A"
    const matchedPayer = group_members.find(
      m => m.toLowerCase() === aiResult.paidBy?.toLowerCase()
    );
 
    // ── WORKAROUND 2: Validasi payer asing ────────────────────────────────────
    // Kalau paidBy dari AI tidak ada di group_members sama sekali → tolak
    // Ini mencegah silent bug dimana payer_id salah assign
    if (!matchedPayer) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${aiResult.paidBy}" tidak ditemukan di group_members. Pastikan nama di teks sesuai dengan anggota grup.`,
        ai_parsed: aiResult,
        group_members
      });
    }
 
    // ── WORKAROUND 3: Title fallback ──────────────────────────────────────────
    // AI kadang return "Transaksi AI" kalau tidak bisa extract judul dari teks
    // Fallback: ambil kata ke-3 sampai ke-5 dari raw_text sebagai judul sementara
    const AI_DEFAULT_TITLE = "Transaksi AI";
    const resolvedTitle = aiResult.title === AI_DEFAULT_TITLE
      ? raw_text.trim().split(/\s+/).slice(2, 5).join(" ")
      : aiResult.title;
 
    // 2. Cari payer_id dari nama matchedPayer (casing sudah benar) di profiles
    const { data: payerProfile, error: payerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', matchedPayer)
      .single();
 
    if (payerError || !payerProfile) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${matchedPayer}" tidak ditemukan di database. Pastikan username sesuai.`,
        parsed: aiResult
      });
    }
 
    // 3. Simpan bill utama (gunakan resolvedTitle dan matchedPayer)
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{
        group_id,
        payer_id: payerProfile.id,
        amount: aiResult.amount,
        description: resolvedTitle,
        category: aiResult.category || 'Lainnya'
      }])
      .select();
 
    if (billError) throw billError;
 
    const bill = billData[0];
 
    // ── WORKAROUND 4: Custom splits override ─────────────────────────────────
    // Kalau request menyertakan custom_splits → pakai itu, skip participants AI
    // Kalau tidak ada → pakai hasil AI seperti biasa (equal split)
    const isCustomSplit = Array.isArray(custom_splits) && custom_splits.length > 0;
 
    // Validasi total custom_splits harus sama dengan amount dari AI
    if (isCustomSplit) {
      const totalCustom = custom_splits.reduce((sum, s) => sum + Number(s.amount), 0);
      if (Math.abs(totalCustom - aiResult.amount) > 1) {
        return res.status(400).json({
          success: false,
          message: `Total custom_splits (${totalCustom}) tidak sesuai dengan amount (${aiResult.amount})!`
        });
      }
    }
 
    // Tentukan sumber participants: custom atau dari AI
    const participantSource = isCustomSplit
      ? custom_splits.map(s => ({ name: s.name, amount: Number(s.amount) }))
      : aiResult.participants;
 
    // 4. Map participants ke member_id lalu simpan splits
    // Pakai case-insensitive matching untuk nama participant
    const splitRows = [];
    for (const participant of participantSource) {
      const matchedMember = group_members.find(
        m => m.toLowerCase() === participant.name?.toLowerCase()
      );
 
      if (!matchedMember) continue; // skip kalau nama tidak ada di group_members
 
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', matchedMember)
        .single();
 
      if (profile) {
        splitRows.push({
          bill_id: bill.id,
          member_id: profile.id,
          share_amount: participant.amount,
          amount_paid: 0,
          is_paid: false
        });
      }
    }
 
    if (splitRows.length > 0) {
      const { error: splitError } = await supabase
        .from('bill_splits')
        .insert(splitRows);
 
      if (splitError) throw splitError;
    }
 
    return res.status(201).json({
      success: true,
      message: "Tagihan berhasil dibuat via AI Smart Input!",
      ai_parsed: {
        title: resolvedTitle,
        amount: aiResult.amount,
        paidBy: matchedPayer,
        category: aiResult.category,
        splitMethod: isCustomSplit ? 'custom' : aiResult.splitMethod,
        participants: participantSource
      },
      bill_summary: bill,
      split_count: splitRows.length
    });
 
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bills/:group_id/history
export const getBillHistory = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('group_id', group_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Riwayat transaksi grup berhasil dimuat.",
      group_id,
      total_bills: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bills/detail/:bill_id
export const getBillDetail = async (req, res) => {
  try {
    const { bill_id } = req.params;

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', bill_id);  // hapus .single()

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Bill tidak ditemukan!" });
    }

    return res.status(200).json({
      success: true,
      data: data[0]  // ambil index pertama
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bills/:bill_id/splits
export const getBillSplits = async (req, res) => {
  try {
    const { bill_id } = req.params;

    const { data, error } = await supabase
      .from('bill_splits')
      .select('*')
      .eq('bill_id', bill_id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/bills/:bill_id
export const updateBill = async (req, res) => {
  try {
    const { bill_id } = req.params;
    const { amount, description, category } = req.body;

    if (!amount && !description && !category) {
      return res.status(400).json({
        success: false,
        message: "Minimal satu field (amount, description, atau category) harus diisi!"
      });
    }

    const updatePayload = {};
    if (amount) updatePayload.amount = Number(amount);
    if (description) updatePayload.description = description;
    if (category) updatePayload.category = category;

    const { data, error } = await supabase
      .from('bills')
      .update(updatePayload)
      .eq('id', bill_id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: "Bill tidak ditemukan!" });
    }

    return res.status(200).json({
      success: true,
      message: "Tagihan berhasil diperbarui. ✏️",
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/bills/:bill_id
export const deleteBill = async (req, res) => {
  try {
    const { bill_id } = req.params;

    const { error: splitDeleteError } = await supabase
      .from('bill_splits')
      .delete()
      .eq('bill_id', bill_id);

    if (splitDeleteError) throw splitDeleteError;

    const { data, error } = await supabase
      .from('bills')
      .delete()
      .eq('id', bill_id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Bill tidak ditemukan!" });
    }

    return res.status(200).json({
      success: true,
      message: "Tagihan berhasil dihapus. 🗑️"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};