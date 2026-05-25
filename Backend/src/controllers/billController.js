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
    const { group_id, payer_id, amount, description, title, category, splits } = req.body;
    const billDescription = description || title; // ← handle keduanya

    if (!group_id || !payer_id || !amount || !billDescription || !splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "group_id, payer_id, amount, description, dan splits (array) wajib diisi!"
      });
    }

    // ✅ Hitung total split tanpa payer (payer tidak berhutang ke dirinya sendiri)
    const nonPayerSplits = splits.filter(s => s.member_id !== payer_id);
    const totalSplits = nonPayerSplits.reduce((sum, s) => sum + Number(s.share_amount), 0);
    const totalAll = splits.reduce((sum, s) => sum + Number(s.share_amount), 0);

    if (Math.abs(totalAll - Number(amount)) > 1) {
      return res.status(400).json({
        success: false,
        message: `Total split (${totalAll}) tidak sesuai dengan total amount (${amount})!`
      });
    }

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{ group_id, payer_id, amount: Number(amount), description: billDescription, category: category || 'Lainnya' }])
      .select();

    if (billError) throw billError;

    const bill = billData[0];

    // ✅ Filter payer dari splitRows supaya payer tidak jadi debtor ke dirinya sendiri
    const splitRows = nonPayerSplits.map(s => ({
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
      `Tagihan baru: "${billDescription}" sebesar Rp${Number(amount).toLocaleString()} dibagi ke ${nonPayerSplits.length} anggota.`,
      { bill_id: bill.id, amount, category, split_count: nonPayerSplits.length }
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

// Helper: parse nominal dari string (handle "10k", "300ribu", "150.000", dll)
const parseNominal = (str) => {
  if (!str) return 0;
  const cleaned = str.toString().toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace('ribu', '000')
    .replace('rb', '000')
    .replace('k', '000')
    .replace('juta', '000000')
    .replace('jt', '000000')
    .trim();
  return parseInt(cleaned) || 0;
};

// Helper: cari semua nominal dari raw_text menggunakan regex
const extractAllNominalsFromText = (text) => {
  const pattern = /(\d+(?:[.,]\d+)*(?:k|rb|ribu|juta|jt)?)/gi;
  const matches = text.match(pattern) || [];
  return matches.map(m => parseNominal(m)).filter(n => n > 0);
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
    const entities = aiResult.rawEntities || [];

    const personAmountMap = {};
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].label === 'PERSON') {
        const personName = entities[i].text;
        for (let j = i + 1; j < entities.length; j++) {
          if (entities[j].label === 'PRICE') {
            personAmountMap[personName] = parseNominal(entities[j].text);
            break;
          }
          if (entities[j].label === 'PERSON') break;
        }
      }
    }

    const allNominals = extractAllNominalsFromText(raw_text);
    const maxNominal = allNominals.length > 0 ? Math.max(...allNominals) : 0;
    const correctedAmount = maxNominal > aiResult.amount ? maxNominal : aiResult.amount;

    const hasPersonSpecificAmounts = Object.keys(personAmountMap).length > 0;
    const isCustomSplit = hasPersonSpecificAmounts;

    let finalParticipants = [];
    let finalSplitMethod = 'equal';

    if (isCustomSplit) {
      finalSplitMethod = 'custom';

      const knownTotal = Object.values(personAmountMap).reduce((sum, v) => sum + v, 0);
      const payer = aiResult.paidBy;
      const payerHasAmount = personAmountMap.hasOwnProperty(payer);
      const remainder = correctedAmount - knownTotal;

      finalParticipants = group_members.map(name => {
        const matchedKey = Object.keys(personAmountMap).find(
          k => k.toLowerCase() === name.toLowerCase()
        );

        if (matchedKey) {
          return { name, amount: personAmountMap[matchedKey] };
        }

        if (name.toLowerCase() === payer?.toLowerCase() && !payerHasAmount && remainder > 0) {
          return { name, amount: remainder };
        }

        return { name, amount: 0 };
      }).filter(p => p.amount > 0);

      const totalCheck = finalParticipants.reduce((sum, p) => sum + p.amount, 0);
      const diff = Math.abs(totalCheck - correctedAmount);

      if (diff > 1000) {
        finalSplitMethod = 'equal';
        const equalShare = Math.floor(correctedAmount / group_members.length);
        const rem = correctedAmount - (equalShare * group_members.length);
        finalParticipants = group_members.map((name, idx) => ({
          name,
          amount: idx === 0 ? equalShare + rem : equalShare
        }));
      }
    } else {
      finalSplitMethod = 'equal';
      const equalShare = Math.floor(correctedAmount / group_members.length);
      const rem = correctedAmount - (equalShare * group_members.length);
      finalParticipants = group_members.map((name, idx) => ({
        name,
        amount: idx === 0 ? equalShare + rem : equalShare
      }));
    }

    // ── STEP 3: Simpan ke Database ──────────────────────────────

    const { data: payerProfile, error: payerError } = await supabase
      .from('profiles')
      .select('id')
      .or(`username.ilike.%${aiResult.paidBy}%,full_name.ilike.%${aiResult.paidBy}%`)
      .single();

    if (payerError || !payerProfile) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${aiResult.paidBy}" tidak ditemukan. Pastikan username sesuai.`,
        ai_parsed: aiResult
      });
    }

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{
        group_id,
        payer_id: payerProfile.id,
        amount: correctedAmount,
        description: (aiResult.title && aiResult.title !== 'Transaksi AI' && aiResult.title !== 'Unknown')
          ? aiResult.title
          : raw_text.slice(0, 50),
        category: aiResult.category || 'Lainnya'
      }])
      .select();

    if (billError) throw billError;
    const bill = billData[0];

    const splitRows = [];
    for (const participant of finalParticipants) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.ilike.%${participant.name}%,full_name.ilike.%${participant.name}%`)
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

    // ✅ Filter payer dari splitRows supaya payer tidak jadi debtor ke dirinya sendiri
    const filteredSplitRows = splitRows.filter(s => s.member_id !== payerProfile.id);

    if (filteredSplitRows.length > 0) {
      const { error: splitError } = await supabase
        .from('bill_splits')
        .insert(filteredSplitRows);
      if (splitError) throw splitError;
    }

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
      split_count: filteredSplitRows.length
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
      .select('*, payer:profiles!bills_payer_id_fkey(full_name, username)')
      .eq('group_id', group_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map(b => ({
      ...b,
      paid_by_name: b.payer?.full_name || b.payer?.username || '—',
    }))


    return res.status(200).json({
      success: true,
      message: "Riwayat transaksi grup berhasil dimuat.",
      group_id,
      total_bills: mapped.length,
      data: mapped
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
      .eq('id', bill_id);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Bill tidak ditemukan!" });
    }

    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bills/:bill_id/splits
export const getBillSplits = async (req, res) => {
  try {
    const { bill_id } = req.params;

    const { data: splits, error } = await supabase
      .from('bill_splits')
      .select('id, bill_id, member_id, share_amount, amount_paid, is_paid')
      .eq('bill_id', bill_id);

    if (error) throw error;
    if (!splits || splits.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const memberIds = splits.map(s => s.member_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', memberIds);

    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = p.full_name || p.username || '—';
    });

    const normalized = splits.map(s => ({
      ...s,
      member_name: profileMap[s.member_id] || '—',
    }));

    return res.status(200).json({ success: true, data: normalized });
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