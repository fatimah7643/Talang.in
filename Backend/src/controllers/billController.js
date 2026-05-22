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
      message: "Tagihan berhasil dicatat dan dibagi! 🧾",
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
    const { group_id, payer_id, raw_text, amount, category, split_count, payer_name, description } = req.body;

    // Jika dipanggil dari app.js lama (dengan amount, category, split_count)
    if (amount && category && split_count) {
      return res.status(200).json({
        success: true,
        parsed_result: { amount, category, split_count, payer_name, description }
      });
    }

    if (!group_id || !payer_id || !raw_text) {
      return res.status(400).json({
        success: false,
        message: "group_id, payer_id, dan raw_text wajib diisi!"
      });
    }

    return res.status(200).json({
      success: true,
      message: "NLP endpoint aktif. Menunggu integrasi model AI. 🤖",
      received: { group_id, payer_id, raw_text },
      note: "Tim AI perlu mengisi logika parsing di sini."
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