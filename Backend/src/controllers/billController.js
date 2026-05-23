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
    const { group_id, raw_text, group_members } = req.body;

    if (!group_id || !raw_text || !group_members || !Array.isArray(group_members)) {
      return res.status(400).json({
        success: false,
        message: "group_id, raw_text, dan group_members (array nama) wajib diisi!"
      });
    }

    // ── STEP 1: Kirim ke AI ──────────────────────────────────────
    const aiResponse = await fetch(`${process.env.AI_BASE_URL}/parse-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: raw_text, entities: [], group_members })
    });

    if (!aiResponse.ok) throw new Error("AI service tidak merespons dengan benar.");

    const aiResult = await aiResponse.json();

    if (aiResult.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: "AI gagal memproses teks transaksi.",
        ai_response: aiResult
      });
    }

    // ── STEP 2: VALIDATION & CORRECTION LAYER ───────────────────

    // 2a. Ekstrak nominal per orang dari raw_text menggunakan rawEntities
    // Bangun map: nama -> nominal dari rawEntities AI
    const personPriceMap = {};
    const entities = aiResult.rawEntities || [];

    // Loop entitas, pasangkan PERSON dengan PRICE terdekat setelahnya
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].label === 'PERSON') {
        const personName = entities[i].text;
        // Cari PRICE berikutnya yang posisinya dekat
        for (let j = i + 1; j < entities.length; j++) {
          if (entities[j].label === 'PRICE') {
            // Ambil nominal dari participants AI untuk person ini
            const participant = aiResult.participants?.find(
              p => p.name.toLowerCase() === personName.toLowerCase()
            );
            if (participant) {
              personPriceMap[personName] = participant.amount;
            }
            break;
          }
          // Stop kalau ketemu PERSON lain sebelum PRICE
          if (entities[j].label === 'PERSON') break;
        }
      }
    }

    // 2b. Deteksi apakah ini custom split
    // Custom split = ada nominal berbeda-beda per orang di raw_text
    // Cara deteksi: cek apakah participants AI punya amount berbeda-beda
    const participantAmounts = (aiResult.participants || []).map(p => p.amount);
    const uniqueAmounts = new Set(participantAmounts);
    const hasCustomAmounts = uniqueAmounts.size > 1;

    // Juga cek dari personPriceMap — kalau ada lebih dari 1 orang dengan nominal beda
    const hasPersonSpecificPrices = Object.keys(personPriceMap).length > 1;

    const isCustomSplit = hasCustomAmounts || hasPersonSpecificPrices;

    // 2c. Koreksi total amount
    // Ambil semua PRICE dari rawEntities
    const allPrices = entities
      .filter(e => e.label === 'PRICE')
      .map(e => {
        // Parse nominal dari text (handle "10k", "300ribu", "150.000", dll)
        const raw = e.text.toLowerCase()
          .replace('ribu', '000')
          .replace('k', '000')
          .replace('rb', '000')
          .replace(/\./g, '')
          .replace(/,/g, '');
        return parseInt(raw) || 0;
      });

    // Total yang benar = ambil nominal terbesar sebagai total utama
    // (asumsi: nominal terbesar = total tagihan, bukan split per orang)
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : aiResult.amount;

    // Jika AI salah baca total (misal: 250k padahal harusnya 300k)
    // Gunakan maxPrice kalau lebih besar dari aiResult.amount
    const correctedAmount = maxPrice > aiResult.amount ? maxPrice : aiResult.amount;

    // 2d. Koreksi participants untuk custom split
    let correctedParticipants = aiResult.participants || [];

    if (isCustomSplit) {
      // Hitung total dari participants yang sudah diketahui nominalnya
      const knownTotal = correctedParticipants
        .filter(p => p.amount > 0)
        .reduce((sum, p) => sum + p.amount, 0);

      // Cek apakah ada payer yang belum dapat porsi (auto remainder)
      const payer = aiResult.paidBy;
      const payerInParticipants = correctedParticipants.find(
        p => p.name.toLowerCase() === payer?.toLowerCase()
      );

      // Jika total known < correctedAmount, payer dapat sisanya
      if (knownTotal < correctedAmount && payerInParticipants) {
        const remainder = correctedAmount - knownTotal;
        // Cek apakah porsi payer di AI sudah dihitung salah (equal)
        const othersTotal = correctedParticipants
          .filter(p => p.name.toLowerCase() !== payer?.toLowerCase())
          .reduce((sum, p) => sum + p.amount, 0);

        if (othersTotal < correctedAmount) {
          correctedParticipants = correctedParticipants.map(p => {
            if (p.name.toLowerCase() === payer?.toLowerCase()) {
              return { ...p, amount: correctedAmount - othersTotal };
            }
            return p;
          });
        }
      }
    }

    // 2e. Validasi final: total split harus = correctedAmount
    const totalSplit = correctedParticipants.reduce((sum, p) => sum + p.amount, 0);
    const splitDiff = Math.abs(totalSplit - correctedAmount);

    // Jika masih selisih > 1000, fallback ke equal split
    let finalParticipants = correctedParticipants;
    let finalSplitMethod = isCustomSplit ? 'custom' : 'equal';

    if (splitDiff > 1000) {
      // Fallback: bagi rata
      const equalShare = Math.floor(correctedAmount / group_members.length);
      const remainder = correctedAmount - (equalShare * group_members.length);
      finalParticipants = group_members.map((name, idx) => ({
        name,
        amount: idx === 0 ? equalShare + remainder : equalShare
      }));
      finalSplitMethod = 'equal';
    }

    // ── STEP 3: Simpan ke Database ──────────────────────────────

    // Cari payer_id
    const { data: payerProfile, error: payerError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', aiResult.paidBy)
      .single();

    if (payerError || !payerProfile) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${aiResult.paidBy}" tidak ditemukan. Pastikan username sesuai.`,
        ai_parsed: aiResult
      });
    }

    // Simpan bill utama dengan amount yang sudah dikoreksi
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{
        group_id,
        payer_id: payerProfile.id,
        amount: correctedAmount,
        description: aiResult.title,
        category: aiResult.category || 'Lainnya'
      }])
      .select();

    if (billError) throw billError;

    const bill = billData[0];

    // Simpan splits
    const splitRows = [];
    for (const participant of finalParticipants) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', participant.name)
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

    // ── STEP 4: Response ────────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: "Tagihan berhasil dibuat via AI Smart Input! 🤖",
      correction_applied: {
        amount_corrected: correctedAmount !== aiResult.amount,
        split_method_overridden: finalSplitMethod !== aiResult.splitMethod,
        original_amount: aiResult.amount,
        corrected_amount: correctedAmount,
        original_split_method: aiResult.splitMethod,
        final_split_method: finalSplitMethod
      },
      ai_parsed: {
        title: aiResult.title,
        amount: correctedAmount,
        paidBy: aiResult.paidBy,
        category: aiResult.category,
        splitMethod: finalSplitMethod,
        participants: finalParticipants
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