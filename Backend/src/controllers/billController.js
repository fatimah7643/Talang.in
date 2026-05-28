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
  if (!str) return 0;
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
  const firstLine = text.trim().split('\n')[0];
  const words = firstLine.split(/\s+/);
  const stopWords = /^(\d|dibayar|dibayarin|bayarin|bayar|total|oleh|sama|dan|yg|yang|udah|sudah|udh|tadi|kemarin|buat|semuanya)$/i;
  const result = [];
  for (const word of words) {
    if (stopWords.test(word)) break;
    if (word.endsWith(',')) {
      result.push(word.replace(/,+$/, ''));
      break;
    }
    result.push(word.replace(/[.:!?]+$/, ''));
    if (result.length >= 5) break;
  }
  return result.join(' ') || firstLine.split(/[,.]/, 1)[0].trim().substring(0, 40);
};

// ─────────────────────────────────────────────────────────────
// FIX: Helper cek apakah member adalah payer
// Sebelumnya hanya cek `m.name.toLowerCase() !== payerNorm` sehingga
// "Maria Peronika" !== "maria" → LOLOS dan ikut jadi debtor (BUG!)
// Sekarang cek firstName juga
// ─────────────────────────────────────────────────────────────
const isPayerMatch = (memberName, payerNorm) => {
  if (!memberName || !payerNorm) return false;
  const nameLower      = memberName.toLowerCase();
  const firstNameLower = memberName.split(' ')[0].toLowerCase();
  return (
    nameLower === payerNorm ||
    firstNameLower === payerNorm ||
    nameLower.includes(payerNorm) ||
    payerNorm.includes(firstNameLower)
  );
};

// ─────────────────────────────────────────────────────────────
// FIX: Deteksi payer dari format "X bayar semuanya" / "X bayar ..."
// yang tidak tertangkap oleh AI (input 3)
// ─────────────────────────────────────────────────────────────
const extractPayerFromText = (text) => {
  const pattern = /^([A-Za-z]+)\s+(?:bayar|dibayar|membayar)/i;
  const m = pattern.exec(text.trim());
  return m ? m[1].toLowerCase() : null;
};

// ─────────────────────────────────────────────────────────────
// FIX: Parse bullet-list items (input 3)
// Format: "* Item harga buat NamaA NamaB" atau "* Nama pesen Item harga"
// Mengembalikan { FirstName: amount } untuk non-payer saja
// ─────────────────────────────────────────────────────────────
const extractBulletItemAmounts = (text, knownMembers, payerFirstName) => {
  const result = {};
  const bulletLines = text.match(/^[\*\-]\s+.+$/gm) || [];

  for (const line of bulletLines) {
    const clean = line.replace(/^[\*\-]\s+/, '');

    // Cari nominal di baris ini
    const nomMatch = clean.match(/(\d+(?:[.,]\d+)*(?:k|rb|ribu|juta|jt)?)/i);
    if (!nomMatch) continue;
    const amount = parseNominal(nomMatch[1]);
    if (!amount) continue;

    // Pola: "buat NamaA NamaB NamaC" → item dibagi rata
    const sharedMatch = clean.match(/(?:buat|untuk|for)\s+([A-Za-z\s]+?)(?:\s*$|[.,*\d])/i);
    if (sharedMatch) {
      const mentioned    = sharedMatch[1].trim().split(/\s+/);
      const matchedMembers = mentioned
        .map(w => knownMembers.find(m => m.split(' ')[0].toLowerCase() === w.toLowerCase()))
        .filter(Boolean);
      if (matchedMembers.length > 0) {
        const sharePerPerson = Math.floor(amount / matchedMembers.length);
        const debtors = matchedMembers.filter(
          m => m.split(' ')[0].toLowerCase() !== payerFirstName.toLowerCase()
        );
        for (const mem of debtors) {
          const fn = mem.split(' ')[0];
          result[fn] = (result[fn] || 0) + sharePerPerson;
        }
        continue;
      }
    }

    // Pola: "NamaX pesen/pesan/order/beli Item harga"
    const personOrderMatch = clean.match(/^([A-Za-z]+)\s+(?:pesen|pesan|order|beli|makan)\s+/i);
    if (personOrderMatch) {
      const personFirst = personOrderMatch[1];
      const matched = knownMembers.find(
        m => m.split(' ')[0].toLowerCase() === personFirst.toLowerCase()
      );
      if (matched && matched.split(' ')[0].toLowerCase() !== payerFirstName.toLowerCase()) {
        const fn = matched.split(' ')[0];
        result[fn] = (result[fn] || 0) + amount;
      }
    }
  }

  return result;
};

const extractSharedAdjustments = (text, participantCount) => {
    let adjustmentPerPerson = 0;

    const lines = text.split('\n');

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Air mineral 5k x5
      const multiMatch = lower.match(
        /(\d+(?:[.,]\d+)*(?:k|rb|ribu|jt|juta)?)\s*x\s*(\d+)/i
      );

      if (multiMatch) {
        const unitPrice = parseNominal(multiMatch[1]);
        const qty = parseInt(multiMatch[2]);

        const total = unitPrice * qty;
        adjustmentPerPerson += Math.floor(total / participantCount);
      }

      // Diskon
      if (lower.includes('diskon')) {
        const nums = extractAllNominalsFromText(lower);
        if (nums.length > 0) {
          adjustmentPerPerson -= Math.floor(nums[0] / participantCount);
        }
      }

      // Pajak
      if (lower.includes('tax') || lower.includes('pajak')) {
        const nums = extractAllNominalsFromText(lower);
        if (nums.length > 0) {
          adjustmentPerPerson += Math.floor(nums[0] / participantCount);
        }
      }
    }

    return adjustmentPerPerson;
  };

// Ekstrak pasangan nama→nominal dari raw_text
const extractPersonAmountsFromText = (text, knownMembers) => {
  const result = {};
  const payerKeywords = /dibayarin|dibayar|bayarin|bayar\s+oleh|ditagih|bayar\s+semuanya|bayar\s+semua/i;

  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const segments = [];
  for (const line of rawLines) {
    const parts = line.split(/,(?!\d)/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (payerKeywords.test(part)) continue;
      if (part) segments.push(part);
    }
  }

  for (const segment of segments) {
    for (const member of knownMembers) {
      const firstName = member.split(' ')[0];
      const pattern = new RegExp(
        `(?:bagian\\s+)?${firstName}[:\\s]+(?:(?:total|sebesar|bayar|utang|punya|sendiri|tagihan)\\s+)?(\\d+(?:[.,]\\d+)*(?:k|rb|ribu|juta|jt)?)`,
        'i'
      );
      const match = pattern.exec(segment);
      if (match) {
        result[firstName] = parseNominal(match[1]);
        break;
      }
    }
  }
  return result;
};

// Distribusi sisa nominal ke semua debtor secara merata
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
        group_members: sortedMembers.map(m => m.name.split(' ')[0])
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
    const entities          = aiResult.rawEntities || []
    const allTextNominals   = extractAllNominalsFromText(raw_text)
    const explicitTextTotal = extractExplicitTotal(raw_text)
    const maxTextNominal    = allTextNominals.length > 0 ? Math.max(...allTextNominals) : 0

    const paidByRaw = Array.isArray(aiResult.paidBy) ? aiResult.paidBy[0] : (aiResult.paidBy ?? '')
    const memberNames = group_members.map(m => m.name)

    // ─────────────────────────────────────────────────────────────
    // FIX: Jika AI gagal detect payer (kosong/unknown), coba ambil
    // dari pola "X bayar semuanya" di raw_text (input 3)
    // ─────────────────────────────────────────────────────────────
    const payerNorm = (
      paidByRaw && paidByRaw.toLowerCase() !== 'unknown' && paidByRaw.trim() !== ''
        ? paidByRaw
        : extractPayerFromText(raw_text) || paidByRaw
    ).toLowerCase()

    let correctedAmount   = aiResult.amount
    let finalSplitMethod  = aiResult.splitMethod || 'equal'
    let finalParticipants = []

    // Cek text extraction DULU
    let personAmountMap = extractPersonAmountsFromText(raw_text, memberNames)

    // ─────────────────────────────────────────────────────────────
    // FIX: Jika tidak ada per-person amounts dari format biasa,
    // coba parse bullet-list format (input 3)
    // ─────────────────────────────────────────────────────────────
    const hasBulletLines = /^[\*\-]\s+/m.test(raw_text)
    if (Object.keys(personAmountMap).length === 0 && hasBulletLines) {
      const payerFirstName = payerNorm.split(' ')[0]
      personAmountMap = extractBulletItemAmounts(raw_text, memberNames, payerFirstName)
    }

    // Fallback ke entities NER jika text kosong
    if (Object.keys(personAmountMap).length === 0) {
      for (let i = 0; i < entities.length; i++) {
        if (entities[i].label === 'PERSON') {
          const personName = entities[i].text
          for (let j = i + 1; j < entities.length; j++) {
            if (entities[j].label === 'PRICE') {
              personAmountMap[personName] = parseNominal(entities[j].text)
              break
            }
            if (entities[j].label === 'PERSON') break
          }
        }
      }
    }

    const hasCustomFromText = Object.keys(personAmountMap).length > 0

    if (!hasCustomFromText && aiResult.splitMethod === 'itemized' && aiResult.participants?.length > 0) {
      const mapped = aiResult.participants
        .filter(p => !isPayerMatch(p.name, payerNorm) && p.amount > 0)
        .map(p => {
          const matched = group_members.find(m =>
            m.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
          )
          return matched ? { id: matched.id, name: matched.name, amount: p.amount } : null
        })
        .filter(Boolean)

      if (mapped.length > 0) {
        finalSplitMethod  = 'itemized'
        correctedAmount   = aiResult.amount
        finalParticipants = mapped
      }

    } else if (hasCustomFromText) {
      // ─────────────────────────────────────────────────────────
      // FIX: Prioritaskan explicitTextTotal. Hanya gunakan
      // maxTextNominal override jika TIDAK ada explicitTextTotal.
      // Sebelumnya kedua kondisi berjalan independen sehingga bisa
      // saling tindih.
      // ─────────────────────────────────────────────────────────
      if (explicitTextTotal > 0) {
        correctedAmount = explicitTextTotal
      } else if (maxTextNominal > 0 && aiResult.amount > maxTextNominal) {
        correctedAmount = maxTextNominal
      }

      finalSplitMethod = 'custom'
      const payerFirstName = payerNorm.split(' ')[0]
      const hasSisanya = /sisanya|sisa\s+buat|sisa\s+gw|sisa\s+aku/i.test(raw_text)

      // Hapus payer dari personAmountMap agar tidak di-charge ke diri sendiri
      const cleanedMap = { ...personAmountMap }
      Object.keys(cleanedMap).forEach(k => {
        if (isPayerMatch(k, payerFirstName)) delete cleanedMap[k]
      })

      let adjustedMap = { ...cleanedMap };

      if (hasSisanya) {
        adjustedMap = distributeRemainder(
          cleanedMap,
          correctedAmount,
          payerFirstName
        );
      }

      // =====================================================
      // APPLY SHARED ADJUSTMENTS
      // =====================================================

      const participantCount = group_members.length;

      const adjustmentPerPerson =
        extractSharedAdjustments(
          raw_text,
          participantCount
        );

      Object.keys(adjustedMap).forEach(k => {
        adjustedMap[k] += adjustmentPerPerson;
      });

      // =====================================================
      // VALIDASI TOTAL CUSTOM SPLIT
      // =====================================================

      const totalAssigned = Object.values(adjustedMap)
        .reduce((a, b) => a + b, 0);

      // Jika total assigned melebihi total bill,
      // normalize / reject
      if (totalAssigned > correctedAmount) {
        return res.status(400).json({
          success: false,
          message:
            `Total custom split (${totalAssigned}) melebihi total tagihan (${correctedAmount}).`
        });
      }

      // ─────────────────────────────────────────────────────────
      // FIX: Gunakan isPayerMatch() bukan perbandingan string langsung
      // Sebelumnya: m.name.toLowerCase() !== payerNorm
      // "Maria Peronika" !== "maria" → true → Maria ikut jadi debtor (BUG!)
      // ─────────────────────────────────────────────────────────
      finalParticipants = group_members
        .map(m => {
          const firstName  = m.name.split(' ')[0]
          const matchedKey = Object.keys(adjustedMap).find(
            k => k.toLowerCase() === firstName.toLowerCase() ||
                k.toLowerCase() === m.name.toLowerCase()
          )
          if (matchedKey && !isPayerMatch(m.name, payerNorm)) {
            // Pastikan menggunakan profile_id milik user, atau fallback ke m.id jika skema foreign key mengarah ke group_members
            const targetId = m.profile_id || m.id; 
            return { id: targetId, name: m.name, amount: adjustedMap[matchedKey] }
          }
          return null
        })
        .filter(p => p !== null && p.amount > 0)

    } else {
      // Equal fallback
      if (explicitTextTotal > 0) {
        correctedAmount = explicitTextTotal
      } else if (maxTextNominal > 0 && aiResult.amount > maxTextNominal) {
        correctedAmount = maxTextNominal
      }

      finalSplitMethod = 'equal'
      const fallbackAmount = correctedAmount > 0 ? correctedAmount : maxTextNominal
      // FIX: gunakan isPayerMatch() di sini juga
      const debtors    = group_members.filter(m => !isPayerMatch(m.name, payerNorm))
      const equalShare = Math.floor(fallbackAmount / debtors.length)
      const rem        = fallbackAmount - equalShare * debtors.length
      finalParticipants = debtors.map((m, idx) => ({
        id: m.id, name: m.name,
        amount: idx === 0 ? equalShare + rem : equalShare
      }))
    }

    // ── STEP 3: Simpan ke Database ──────────────────────────────

    const payerMember = group_members.find(m => isPayerMatch(m.name, payerNorm))

    if (!payerMember) {
      return res.status(400).json({
        success: false,
        message: `Pembayar "${paidByRaw}" tidak ditemukan di daftar anggota grup.`,
        ai_parsed: aiResult
      });
    }

    let payerProfileId = payerMember.profile_id || payerMember.id;

    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', payerProfileId)
      .single();

    if (!profileCheck) {
      const { data: gmRow } = await supabase
        .from('group_members')
        .select('profile_id')
        .eq('id', payerProfileId)
        .single();
      if (gmRow) payerProfileId = gmRow.profile_id;
    }

    const payerProfile = { id: payerProfileId };

    const isBadTitle = (t) => {
      if (!t || t === 'Transaksi AI' || t === 'Unknown') return true;
      if (t.length > 50) return true;
      if (/\d/.test(t)) return true;
      if ((t.match(/,/g) || []).length >= 2) return true;
      return false;
    };
    const billTitle = isBadTitle(aiResult.title)
      ? extractShortTitle(raw_text)
      : aiResult.title;

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([{
        group_id,
        payer_id:     payerProfile.id,
        amount:       correctedAmount,
        description:  billTitle,
        category:     aiResult.category || 'Lainnya',
        split_method: finalSplitMethod
      }])
      .select();

    if (billError) throw billError;
    const bill = billData[0];

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

    const filteredSplitRows = splitRows.filter(
      s => s.member_id !== payerMember.id
    );

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

    // Melakukan pengambilan data split sekaligus men-join nama profilnya secara otomatis
    const { data: splits, error } = await supabase
      .from('bill_splits')
      .select(`
        id,
        bill_id,
        member_id,
        share_amount,
        amount_paid,
        is_paid,
        profiles!member_id (
          full_name,
          username
        )
      `)
      .eq('bill_id', bill_id);

    if (error) throw error;

    if (!splits || splits.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Lakukan normalisasi hasil join ke properti 'member_name'
    const normalized = splits.map(s => {
      const name = s.profiles ? (s.profiles.full_name || s.profiles.username) : '—';
      return {
        id: s.id,
        bill_id: s.bill_id,
        member_id: s.member_id,
        share_amount: s.share_amount,
        amount_paid: s.amount_paid,
        is_paid: s.is_paid,
        member_name: name
      };
    });

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