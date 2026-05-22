import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/v1/settlements/:group_id/recap
export const getDebtRecap = async (req, res) => {
  try {
    const { group_id } = req.params;

    // Ambil semua split yang belum lunas beserta info bill dan member
    const { data, error } = await supabase
      .from('bill_splits')
      .select(`
        id,
        member_id,
        share_amount,
        amount_paid,
        is_paid,
        bills!bill_id (
          id,
          payer_id,
          description,
          category,
          group_id,
          profiles!payer_id (
            username,
            full_name
          )
        ),
        profiles!member_id (
          username,
          full_name
        )
      `)
      .eq('bills.group_id', group_id)
      .eq('is_paid', false);

    if (error) throw error;

    // Susun rekap: siapa berhutang kepada siapa dan berapa
    const debtMap = {};

    data.forEach(split => {
      const debtor_id = split.member_id;
      const creditor_id = split.bills?.payer_id;

      // Pembayar tidak berhutang ke dirinya sendiri
      if (!creditor_id || debtor_id === creditor_id) return;

      const remaining = Number(split.share_amount) - Number(split.amount_paid);
      if (remaining <= 0) return;

      const key = `${debtor_id}__${creditor_id}`;
      if (!debtMap[key]) {
        debtMap[key] = {
          debtor_id,
          debtor_name: split.profiles?.full_name || split.profiles?.username,
          creditor_id,
          creditor_name: split.bills?.profiles?.full_name || split.bills?.profiles?.username,
          total_debt: 0,
          transactions: []
        };
      }

      debtMap[key].total_debt += remaining;
      debtMap[key].transactions.push({
        split_id: split.id,
        bill_description: split.bills?.description,
        share_amount: split.share_amount,
        amount_paid: split.amount_paid,
        remaining_debt: remaining
      });
    });

    const recap = Object.values(debtMap);

    return res.status(200).json({
      success: true,
      message: "Rekapitulasi utang grup berhasil dikalkulasi.",
      group_id,
      total_debt_entries: recap.length,
      data: recap
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/settlements/:group_id/simplify
// Algoritma Simplify Debt berbasis net balance (greedy graph reduction)
export const simplifyDebt = async (req, res) => {
  try {
    const { group_id } = req.params;

    // Ambil semua split yang belum lunas
    const { data, error } = await supabase
      .from('bill_splits')
      .select(`
        member_id,
        share_amount,
        amount_paid,
        is_paid,
        bills!bill_id (
          payer_id,
          group_id
        )
      `)
      .eq('bills.group_id', group_id)
      .eq('is_paid', false);

    if (error) throw error;

    // Hitung net balance tiap anggota (positif = piutang, negatif = hutang)
    const balance = {};

    data.forEach(split => {
      const debtor = split.member_id;
      const creditor = split.bills?.payer_id;
      if (!creditor || debtor === creditor) return;

      const remaining = Number(split.share_amount) - Number(split.amount_paid);
      if (remaining <= 0) return;

      balance[debtor] = (balance[debtor] || 0) - remaining;
      balance[creditor] = (balance[creditor] || 0) + remaining;
    });

    // Ambil profil semua anggota untuk nama
    const memberIds = Object.keys(balance);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', memberIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || p.username; });

    // Greedy algorithm: pasangkan debitur terbesar dengan kreditur terbesar
    const debtors = Object.entries(balance)
      .filter(([, v]) => v < 0)
      .map(([id, v]) => ({ id, amount: Math.abs(v) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balance)
      .filter(([, v]) => v > 0)
      .map(([id, v]) => ({ id, amount: v }))
      .sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];
      const settle = Math.min(d.amount, c.amount);

      transactions.push({
        from: d.id,
        from_name: profileMap[d.id] || d.id,
        to: c.id,
        to_name: profileMap[c.id] || c.id,
        amount: settle
      });

      d.amount -= settle;
      c.amount -= settle;

      if (d.amount < 0.01) i++;
      if (c.amount < 0.01) j++;
    }

    return res.status(200).json({
      success: true,
      message: `Utang berhasil disederhanakan menjadi ${transactions.length} transfer minimal.`,
      group_id,
      original_entries: data.length,
      simplified_transactions: transactions.length,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/settlements/splits/:split_id/pay
export const markAsPaid = async (req, res) => {
  try {
    const { split_id } = req.params;
    const { payment_type, amount } = req.body;

    if (!payment_type || !['partial', 'full'].includes(payment_type)) {
      return res.status(400).json({
        success: false,
        message: "payment_type wajib diisi dengan nilai 'partial' atau 'full'!"
      });
    }

    if (payment_type === 'partial' && (!amount || Number(amount) <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Untuk pembayaran partial, field 'amount' wajib diisi dengan nilai positif!"
      });
    }

    // Ambil data split saat ini
    const { data: split, error: findError } = await supabase
      .from('bill_splits')
      .select('id, share_amount, amount_paid, is_paid')
      .eq('id', split_id)
      .single();

    if (findError || !split) {
      return res.status(404).json({ success: false, message: "Data split tidak ditemukan!" });
    }

    if (split.is_paid) {
      return res.status(400).json({ success: false, message: "Utang ini sudah lunas sebelumnya!" });
    }

    let new_amount_paid;
    let new_is_paid;

    if (payment_type === 'full') {
      // Bayar lunas: paksa amount_paid = share_amount
      new_amount_paid = Number(split.share_amount);
      new_is_paid = true;
    } else {
      // Bayar sebagian: akumulasi cicilan
      new_amount_paid = Number(split.amount_paid) + Number(amount);

      // Jika cicilan sudah menyentuh atau melebihi target, otomatis lunas
      new_is_paid = new_amount_paid >= Number(split.share_amount);

      // Tidak boleh overpay
      if (new_amount_paid > Number(split.share_amount)) {
        new_amount_paid = Number(split.share_amount);
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('bill_splits')
      .update({ amount_paid: new_amount_paid, is_paid: new_is_paid })
      .eq('id', split_id)
      .select();

    if (updateError) throw updateError;

    const remaining = Number(split.share_amount) - new_amount_paid;

    return res.status(200).json({
      success: true,
      message: new_is_paid
        ? "Utang berhasil dilunasi sepenuhnya! ✅"
        : `Cicilan berhasil dicatat. Sisa utang: Rp${remaining.toLocaleString()} 💸`,
      data: {
        split_id,
        share_amount: split.share_amount,
        amount_paid: new_amount_paid,
        remaining_debt: remaining,
        is_paid: new_is_paid
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};