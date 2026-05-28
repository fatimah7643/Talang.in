import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createNotification } from './notificationController.js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const logActivity = async (group_id, user_id, activity_type, description) => {
  try {
    await supabase.from('activity_logs').insert([{
      group_id,
      user_id,
      activity_type,
      description,
    }]);
  } catch (err) {
    console.warn("Gagal mencatat activity_log:", err.message);
  }
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/v1/bills/split
═══════════════════════════════════════════════════════════════ */
export const splitBill = async (req, res) => {
  try {
    const { group_id, payer_id, amount, description, title, category, splits, split_method } = req.body;
    const billDescription = description || title;

    if (!group_id || !payer_id || !amount || !billDescription || !splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "group_id, payer_id, amount, description, dan splits (array) wajib diisi!"
      });
    }

    const nonPayerSplits = splits.filter(s => s.member_id !== payer_id);
    const totalAll = splits.reduce((sum, s) => sum + Number(s.share_amount), 0);
    if (totalAll > Number(amount) + 1) {
      return res.status(400).json({
        success: false,
        message: `Total split (${totalAll}) melebihi total amount (${amount})!`
      });
    }

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{ group_id, payer_id, amount: Number(amount), description: billDescription, category: category || 'Lainnya', split_method: split_method || 'equal' }])
      .select();

    if (billError) throw billError;

    const bill = billData[0];

    const splitRows = nonPayerSplits.map(s => ({
      bill_id:      bill.id,
      member_id:    s.member_id,
      share_amount: Number(s.share_amount),
      amount_paid:  0,
      is_paid:      false
    }));

    const { data: splitData, error: splitError } = await supabase
      .from('bill_splits')
      .insert(splitRows)
      .select();

    if (splitError) throw splitError;

    await logActivity(
      group_id, payer_id, 'BILL_CREATED',
      `Tagihan baru: "${billDescription}" sebesar Rp${Number(amount).toLocaleString()} dibagi ke ${nonPayerSplits.length} anggota.`
    );

    await Promise.all(nonPayerSplits.map(s =>
      createNotification({
        user_id: s.member_id,
        type:    'transaction',
        title:   `Tagihan baru: ${billDescription}`,
        message: `Kamu punya tagihan Rp${Number(s.share_amount).toLocaleString()} yang perlu dibayar.`,
      })
    ));

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

/* ═══════════════════════════════════════════════════════════════
   HELPERS — NLP
═══════════════════════════════════════════════════════════════ */

// Parse nominal dari string: "10k" → 10000, "300ribu" → 300000, dll
const parseNominal = (str) => {
  if (!str && str !== 0) return 0;
  if (typeof str === 'number') return Math.floor(str);
  let cleaned = str.toString().toLowerCase().trim();

  // Handle desimal: "1,5jt" atau "1.5jt" -> ubah jadi float dulu
  const multiplierMatch = cleaned.match(/^([\d,.]+)\s*(k|rb|ribu|jt|juta)$/i);
  if (multiplierMatch) {
    let num = parseFloat(multiplierMatch[1].replace(',', '.'));
    const unit = multiplierMatch[2];
    if (unit === 'k' || unit === 'rb' || unit === 'ribu') num *= 1000;
    if (unit === 'jt' || unit === 'juta') num *= 1000000;
    return Math.floor(num);
  }

  cleaned = cleaned
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace('ribu', '000').replace('rb', '000').replace('k', '000')
    .replace('juta', '000000').replace('jt', '000000')
    .trim();
  return parseInt(cleaned) || 0;
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/v1/bills/split-nlp
═══════════════════════════════════════════════════════════════ */
export const splitBillNLP = async (req, res) => {
  try {
    const { group_id, raw_text, group_members } = req.body;

    if (!group_id || !raw_text || !group_members || !Array.isArray(group_members)) {
      return res.status(400).json({
        success: false,
        message: "group_id, raw_text, dan group_members (array nama) wajib diisi!"
      });
    }

    const memberNames = group_members.map(m => (typeof m === 'string' ? m : m.name));

    // ── STEP 1: Kirim ke AI ──────────────────────────────────────
    const aiResponse = await fetch(`${process.env.AI_BASE_URL}/parse-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: raw_text, 
        entities: [],
        group_members: memberNames
      })
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

    // ── STEP 2: Mapping Payer ───────────────────────────────────
    const paidByRaw = Array.isArray(aiResult.paidBy) ? aiResult.paidBy[0] : (aiResult.paidBy ?? '');
    const payerNorm = paidByRaw.toLowerCase();

    const payerMember = group_members.find(m => {
      const name = (typeof m === 'string' ? m : m.name).toLowerCase();
      return name === payerNorm || name.includes(payerNorm) || payerNorm.includes(name.split(' ')[0]);
    });

    if (!payerMember) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${paidByRaw}" tidak ditemukan di daftar anggota grup.`,
        ai_parsed: aiResult
      });
    }

    // Resolve payer profile_id
    let payerProfileId = payerMember.profile_id || payerMember.id;
    const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', payerProfileId).single();
    if (!profileCheck) {
      const { data: gmRow } = await supabase.from('group_members').select('profile_id').eq('id', payerProfileId).single();
      if (gmRow) payerProfileId = gmRow.profile_id;
    }

    // ── STEP 3: Mapping Participants & Calculation ──────────────
    const totalAmount = parseNominal(aiResult.amount);
    const aiParticipants = aiResult.participants || [];
    
    // Infer split method: Jika AI kasih nominal per orang, jangan pakai 'equal'
    let finalSplitMethod = aiResult.splitMethod;
    const hasParticipantAmounts = aiParticipants.some(p => parseNominal(p.amount) > 0);
    
    if (hasParticipantAmounts) {
      finalSplitMethod = (finalSplitMethod === 'equal') ? 'custom' : (finalSplitMethod || 'custom');
    } else {
      finalSplitMethod = finalSplitMethod || 'equal';
    }

    let finalParticipants = [];

    if (finalSplitMethod === 'equal') {
      // Logic equal: bagi rata ke semua peserta yang disebutkan AI, atau ke semua member jika AI tidak spesifik
      let participantNames = aiParticipants.map(p => p.name.toLowerCase());
      
      let targetMembers = group_members;
      if (participantNames.length > 0) {
        targetMembers = group_members.filter(m => {
          const name = (typeof m === 'string' ? m : m.name).toLowerCase();
          // Match jika nama lengkap sama, atau mengandung nama dari AI, atau AI mengandung nama depan member
          return participantNames.includes(name) || 
                 participantNames.some(pn => name.includes(pn) || pn.includes(name.split(' ')[0]));
        });
      }

      if (targetMembers.length === 0) targetMembers = group_members;

      const groupCount = targetMembers.length;
      const share = Math.floor(totalAmount / groupCount);
      const remainder = totalAmount - (share * groupCount);

      const nonPayerMembers = targetMembers.filter(m => m.id !== payerMember.id);

      // Pastikan remainder ditaruh ke salah satu non-payer agar billAmount benar
      finalParticipants = nonPayerMembers.map((m, idx) => ({
        id: m.id,
        name: typeof m === 'string' ? m : m.name,
        amount: idx === 0 ? share + remainder : share
      }));
    } else {
      // Logic custom/itemized: gunakan data per-orang dari AI
      finalParticipants = aiParticipants
        .map(p => {
          const matched = group_members.find(m => {
            const name = (typeof m === 'string' ? m : m.name).toLowerCase();
            return name === p.name.toLowerCase() || 
                   name.includes(p.name.toLowerCase()) || 
                   p.name.toLowerCase().includes(name.split(' ')[0]);
          });
          return matched ? { id: matched.id, name: typeof matched === 'string' ? matched : matched.name, amount: parseNominal(p.amount) } : null;
        })
        .filter(p => p !== null && p.amount > 0);
    }

    // Fallback: Jika tidak ada peserta yang ter-match
    if (finalParticipants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Gagal mencocokkan peserta transaksi dengan anggota grup.",
        ai_parsed: aiResult
      });
    }

    // Filter payer dari splits (payer tidak hutang ke diri sendiri)
    const nonPayerSplits = finalParticipants.filter(p => p.id !== payerMember.id);
    
    // Bill amount = Total tagihan ke orang lain saja
    const billAmount = nonPayerSplits.reduce((sum, p) => sum + p.amount, 0);

    // ── STEP 4: Simpan ke Database ──────────────────────────────
    const billTitle = (aiResult.title?.trim() && aiResult.title !== 'Unknown' && aiResult.title !== 'Transaksi AI')
      ? aiResult.title.trim()
      : "Tagihan AI";

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{
        group_id,
        payer_id:     payerProfileId,
        amount:       billAmount,
        description:  billTitle,
        category:     aiResult.category || 'Lainnya',
        split_method: finalSplitMethod
      }])
      .select();

    if (billError) throw billError;
    const bill = billData[0];

    const splitRows = nonPayerSplits.map(s => ({
      bill_id:      bill.id,
      member_id:    s.id,
      share_amount: s.amount,
      amount_paid:  0,
      is_paid:      false
    }));

    if (splitRows.length > 0) {
      const { error: splitError } = await supabase.from('bill_splits').insert(splitRows);
      if (splitError) throw splitError;
    }

    await logActivity(
      group_id, payerProfileId, 'BILL_CREATED',
      `Tagihan AI: "${bill.description}" sebesar Rp${billAmount.toLocaleString()} dibagi ke ${splitRows.length} anggota.`
    );

    await Promise.all(splitRows.map(s =>
      createNotification({
        user_id: s.member_id,
        type:    'transaction',
        title:   `Tagihan baru: ${bill.description}`,
        message: `Kamu punya tagihan Rp${Number(s.share_amount).toLocaleString()} yang perlu dibayar.`,
      })
    ));

    return res.status(201).json({
      success: true,
      message: "Tagihan berhasil dibuat via AI Smart Input!",
      ai_parsed: {
        title:        billTitle,
        total_original: totalAmount,
        bill_amount:  billAmount,
        paidBy:       paidByRaw,
        splitMethod:  finalSplitMethod,
        participants: finalParticipants
      },
      bill_summary: bill,
      split_count:  splitRows.length
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/v1/bills/:group_id/history
═══════════════════════════════════════════════════════════════ */
export const getBillHistory = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from('bills')
      .select('*, payer:profiles!payer_id(full_name, username), group:groups!group_id(group_name)')
      .eq('group_id', group_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map(b => ({
      ...b,
      paid_by_name: b.payer?.full_name || b.payer?.username || '—',
      group_name: b.group?.group_name || '—'
    }));

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

/* ═══════════════════════════════════════════════════════════════
   GET /api/v1/bills/detail/:bill_id
═══════════════════════════════════════════════════════════════ */
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

    return res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/v1/bills/:bill_id/splits
═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   PUT /api/v1/bills/:bill_id
═══════════════════════════════════════════════════════════════ */
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
    if (amount)      updatePayload.amount      = Number(amount);
    if (description) updatePayload.description = description;
    if (category)    updatePayload.category    = category;

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
      message: "Tagihan berhasil diperbarui.",
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   DELETE /api/v1/bills/:bill_id
═══════════════════════════════════════════════════════════════ */
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
      message: "Tagihan berhasil dihapus!"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};