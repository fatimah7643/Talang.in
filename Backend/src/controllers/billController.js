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
    const { group_id, payer_id, amount, description, title, category, splits } = req.body;
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
      .insert([{ group_id, payer_id, amount: Number(amount), description: billDescription, category: category || 'Lainnya' }])
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
  if (!str) return 0;
  const cleaned = str.toString().toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace('ribu', '000')
    .replace('rb',   '000')
    .replace('k',    '000')
    .replace('juta', '000000')
    .replace('jt',   '000000')
    .trim();
  return parseInt(cleaned) || 0;
};

// Cari semua nominal dari teks
const extractAllNominalsFromText = (text) => {
  const pattern = /(\d+(?:[.,]\d+)*(?:k|rb|ribu|juta|jt)?)/gi;
  const matches = text.match(pattern) || [];
  return matches.map(m => parseNominal(m)).filter(n => n > 0);
};

// Ekstrak nominal setelah kata "total" → "total 250000" → 250000
const extractExplicitTotal = (text) => {
  const pattern = /total\s+(\d+(?:[.,]\d+)*(?:k|rb|ribu|juta|jt)?)/gi;
  const match = pattern.exec(text);
  if (match) return parseNominal(match[1]);
  return 0;
};

// Ambil 4 kata pertama sebagai judul singkat
const extractShortTitle = (text) => {
  return text.trim().split(/\s+/).slice(0, 4).join(' ').replace(/[.,!?]+$/, '');
};

// Ekstrak pasangan nama→nominal dari raw_text, parse per-baris
// Handle: "risna total 30000", "fatimah 20000", "bagian Risna 100rb", "Risna: 100.000"
const extractPersonAmountsFromText = (text, knownMembers) => {
  const result = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // Skip baris header yang menandakan siapa yang bayar (bukan split per-orang)
  const payerKeywords = /dibayarin|dibayar|bayarin|bayar\s+oleh|ditagih/i;

  for (const line of lines) {
    if (payerKeywords.test(line)) continue;
    for (const member of knownMembers) {
      const firstName = member.split(' ')[0];
      // ^ agar match dari awal baris, (?:total|sebesar)? agar handle "risna total 30000"
      const pattern = new RegExp(
        `^(?:bagian\\s+)?${firstName}[:\\s]+(?:(?:total|sebesar)\\s+)?(\\d+(?:[.,]\\d+)*(?:k|rb|ribu|juta|jt)?)`,
        'i'
      );
      const match = pattern.exec(line);
      if (match) {
        result[firstName] = parseNominal(match[1]);
        break; // satu baris = satu orang
      }
    }
  }
  return result;
};

// Distribusi sisa nominal yang tidak teratribusi ke orang manapun (misal baris item "es teh 6 10000")
// ke semua debtor secara merata agar total splits = totalAmount
const distributeRemainder = (personAmountMap, totalAmount, payerFirstName) => {
  const assignedTotal = Object.values(personAmountMap).reduce((a, b) => a + b, 0);
  const remainder = totalAmount - assignedTotal;
  if (remainder <= 0) return personAmountMap;

  const debtors = Object.keys(personAmountMap).filter(
    k => k.toLowerCase() !== payerFirstName?.toLowerCase()
  );
  if (debtors.length === 0) return personAmountMap;

  const perPerson = Math.floor(remainder / debtors.length);
  let extra = remainder - perPerson * debtors.length;

  const updated = { ...personAmountMap };
  for (const debtor of debtors) {
    updated[debtor] = (updated[debtor] || 0) + perPerson + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
  }
  return updated;
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

    // ── STEP 1: Kirim ke AI ──────────────────────────────────────
    const sortedMembers = [...group_members].sort((a, b) => {
      const posA = raw_text.toLowerCase().indexOf(a.name.split(' ')[0].toLowerCase())
      const posB = raw_text.toLowerCase().indexOf(b.name.split(' ')[0].toLowerCase())
      return (posA === -1 ? 999 : posA) - (posB === -1 ? 999 : posB)
    });
    const aiResponse = await fetch(`${process.env.AI_BASE_URL}/parse-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: raw_text, 
        entities: [],
        group_members: sortedMembers.map(m => m.name)
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

    // ── STEP 2: VALIDATION & CORRECTION LAYER ───────────────────
    const entities       = aiResult.rawEntities || [];
    const correctedAmount = aiResult.amount;

    // Handle paidBy sebagai string ATAU array (model baru bisa return array jika ada 2 payer)
    const paidByRaw  = Array.isArray(aiResult.paidBy) ? aiResult.paidBy[0] : (aiResult.paidBy ?? '');
    const payerNorm  = paidByRaw.toLowerCase();

    let finalParticipants = [];
    let finalSplitMethod  = aiResult.splitMethod || 'equal';

    const memberNames = group_members.map(m => m.name);

    // Priority 1: ekstrak per-person amounts langsung dari teks (paling akurat)
    // Ini menangani format: "risna total 30000", "fatimah 20000", dll
    let personAmountMap = extractPersonAmountsFromText(raw_text, memberNames);

    // Priority 2: jika teks tidak punya per-person, coba dari entities NER hasil AI
    if (Object.keys(personAmountMap).length === 0) {
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
    }

    const hasCustom = Object.keys(personAmountMap).length > 0;

    // Priority 3: AI itemized — hanya dipakai jika text & entities tidak menemukan per-person amounts
    // (kasus ini untuk struk/nota dengan diskon, qty, tax yang AI hitung sendiri)
    if (!hasCustom && aiResult.splitMethod === 'itemized' && aiResult.participants?.length > 0) {
      finalSplitMethod  = 'itemized';
      finalParticipants = aiResult.participants
        .filter(p => p.name?.toLowerCase() !== payerNorm && p.amount > 0)
        .map(p => {
          const matched = group_members.find(m =>
            m.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
          );
          return matched ? { id: matched.id, name: matched.name, amount: p.amount } : null;
        })
        .filter(p => p !== null);

    } else if (hasCustom) {
      // Custom split: per-person amounts ditemukan dari teks atau entities
      finalSplitMethod = 'custom';

      // Distribusi sisa nominal untracked (misal baris item "es teh 6 10000")
      // agar total splits = correctedAmount
      const payerFirstName = paidByRaw.split(' ')[0];
      const adjustedMap = distributeRemainder(personAmountMap, correctedAmount, payerFirstName);

      finalParticipants = group_members
        .map(m => {
          const firstName  = m.name.split(' ')[0];
          const matchedKey = Object.keys(adjustedMap).find(
            k => k.toLowerCase() === firstName.toLowerCase() ||
                 k.toLowerCase() === m.name.toLowerCase()
          );
          if (matchedKey && m.name.toLowerCase() !== payerNorm) {
            return { id: m.id, name: m.name, amount: adjustedMap[matchedKey] };
          }
          return null;
        })
        .filter(p => p !== null && p.amount > 0);

    } else {
      // Equal split: tidak ada info per-person sama sekali
      finalSplitMethod = 'equal';
      const allNominals    = extractAllNominalsFromText(raw_text);
      const explicitTotal  = extractExplicitTotal(raw_text);
      const maxNominal     = allNominals.length > 0 ? Math.max(...allNominals) : 0;
      const fallbackAmount = explicitTotal > 0
        ? explicitTotal
        : (aiResult.amount && aiResult.amount <= maxNominal ? aiResult.amount : maxNominal);

      const debtors    = group_members.filter(m => m.name.toLowerCase() !== payerNorm);
      const equalShare = Math.floor(fallbackAmount / debtors.length);
      const rem        = fallbackAmount - equalShare * debtors.length;
      finalParticipants = debtors.map((m, idx) => ({
        id:     m.id,
        name:   m.name,
        amount: idx === 0 ? equalShare + rem : equalShare
      }));
    }

        // ── STEP 3: Simpan ke Database ──────────────────────────────

    // Cari payer di profiles
    const payerMember = group_members.find(m => 
      m.name.toLowerCase().includes(payerNorm) ||
      payerNorm.includes(m.name.split(' ')[0].toLowerCase())
    )

    const payerProfile = payerMember ? { id: payerMember.id } : null

    if (!payerProfile) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${paidByRaw}" tidak ditemukan di daftar anggota grup.`,
        ai_parsed: aiResult
      });
    }

    // FIX TITLE: pakai extractShortTitle kalau AI gagal
    const billTitle = (
      aiResult.title &&
      aiResult.title !== 'Transaksi AI' &&
      aiResult.title !== 'Unknown' &&
      aiResult.title.length < 40
    )
      ? aiResult.title
      : extractShortTitle(raw_text);

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{
        group_id,
        payer_id:    payerProfile.id,
        amount:      correctedAmount,
        description: billTitle,
        category:    aiResult.category || 'Lainnya'
      }])
      .select();

    if (billError) throw billError;
    const bill = billData[0];

    // Cari member_id tiap participant lalu susun splitRows
    const splitRows = [];
    for (const participant of finalParticipants) {
      if (!participant.id) continue
      splitRows.push({
        bill_id:      bill.id,
        member_id:    participant.id,
        share_amount: participant.amount,
        amount_paid:  0,
        is_paid:      false
      })
    }

    // Filter payer dari splits (payer tidak hutang ke diri sendiri)
    const filteredSplitRows = splitRows.filter(s => s.member_id !== payerProfile.id);

    if (filteredSplitRows.length > 0) {
      const { error: splitError } = await supabase
        .from('bill_splits')
        .insert(filteredSplitRows);
      if (splitError) throw splitError;
    }

    await logActivity(
      group_id,
      payerProfile.id,
      'BILL_CREATED',
      `Tagihan AI: "${bill.description}" sebesar Rp${correctedAmount.toLocaleString()} dibagi ke ${filteredSplitRows.length} anggota.`
    );

    await Promise.all(filteredSplitRows.map(s =>
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
      correction_applied: {
        amount_corrected:        correctedAmount !== aiResult.amount,
        split_method_overridden: finalSplitMethod !== aiResult.splitMethod,
        original_amount:         aiResult.amount,
        corrected_amount:        correctedAmount,
        original_split_method:   aiResult.splitMethod,
        final_split_method:      finalSplitMethod
      },
      ai_parsed: {
        title:        billTitle,
        amount:       correctedAmount,
        paidBy:       paidByRaw,
        category:     aiResult.category,
        splitMethod:  finalSplitMethod,
        participants: finalParticipants
      },
      bill_summary: bill,
      split_count:  filteredSplitRows.length
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