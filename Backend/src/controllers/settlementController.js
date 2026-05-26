import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/v1/settlements/:group_id/recap
export const getDebtRecap = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, payer_id, description, category, payer:profiles!bills_payer_id_fkey(username, full_name)')
      .eq('group_id', group_id);

    if (billsError) throw billsError;
    if (!bills || bills.length === 0) {
      return res.status(200).json({ success: true, message: "Tidak ada tagihan.", group_id, total_debt_entries: 0, data: [] });
    }

    const billIds = bills.map(b => b.id);
    const billMap = {};
    bills.forEach(b => { billMap[b.id] = b; });

    const { data: splits, error: splitsError } = await supabase
      .from('bill_splits')
      .select('id, member_id, bill_id, share_amount, amount_paid, is_paid, member:profiles!bill_splits_member_id_fkey(username, full_name)')
      .in('bill_id', billIds)
      .eq('is_paid', false);

    if (splitsError) throw splitsError;

    const debtMap = {};

    (splits || []).forEach(split => {
      const debtor_id = split.member_id;
      const bill = billMap[split.bill_id];
      const creditor_id = bill?.payer_id;

      if (!creditor_id || debtor_id === creditor_id) return;

      const remaining = Number(split.share_amount) - Number(split.amount_paid);
      if (remaining <= 0) return;

      const key = `${debtor_id}__${creditor_id}`;
      if (!debtMap[key]) {
        debtMap[key] = {
          debtor_id,
          debtor_name: split.member?.full_name || split.member?.username || 'Unknown',
          creditor_id,
          creditor_name: bill.payer?.full_name || bill.payer?.username || 'Unknown',
          total_debt: 0,
          transactions: []
        };
      }

      debtMap[key].total_debt += remaining;
      debtMap[key].transactions.push({
        split_id: split.id,
        bill_description: bill.description,
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
export const simplifyDebt = async (req, res) => {
  try {
    const { group_id } = req.params;

    // ✅ Step 1: ambil bills dulu by group_id
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, payer_id')
      .eq('group_id', group_id);

    if (billsError) throw billsError;
    if (!bills || bills.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Tidak ada tagihan di grup ini.",
        group_id,
        original_entries: 0,
        simplified_transactions: 0,
        data: []
      });
    }

    const billIds = bills.map(b => b.id);
    const billMap = {};
    bills.forEach(b => { billMap[b.id] = b; });

    // ✅ Step 2: ambil splits berdasarkan bill_id
    const { data: splits, error: splitsError } = await supabase
      .from('bill_splits')
      .select('member_id, bill_id, share_amount, amount_paid, is_paid')
      .in('bill_id', billIds)
      .eq('is_paid', false);

    if (splitsError) throw splitsError;

    // Hitung net balance tiap anggota (positif = piutang, negatif = hutang)
    const balance = {};

    (splits || []).forEach(split => {
      const debtor = split.member_id;
      const creditor = billMap[split.bill_id]?.payer_id;
      if (!creditor || debtor === creditor) return;

      const remaining = Number(split.share_amount) - Number(split.amount_paid);
      if (remaining <= 0) return;

      balance[debtor] = (balance[debtor] || 0) - remaining;
      balance[creditor] = (balance[creditor] || 0) + remaining;
    });

    const memberIds = Object.keys(balance);
    if (memberIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Semua hutang sudah lunas!",
        group_id,
        original_entries: splits?.length || 0,
        simplified_transactions: 0,
        data: []
      });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', memberIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || p.username; });

    // Greedy algorithm
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

    // Simpan ke simplified_debts (hapus lama, insert baru)
    await supabase.from('simplified_debts').delete().eq('group_id', group_id);
    if (transactions.length > 0) {
      await supabase.from('simplified_debts').insert(
        transactions.map(t => ({
          group_id,
          debtor_id:   t.from,
          creditor_id: t.to,
          amount:      t.amount,
        }))
      );
    }

    return res.status(200).json({
      success: true,
      message: `Utang berhasil disederhanakan menjadi ${transactions.length} transfer minimal.`,
      group_id,
      original_entries: splits?.length || 0,
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
      new_amount_paid = Number(split.share_amount);
      new_is_paid = true;
    } else {
      new_amount_paid = Number(split.amount_paid) + Number(amount);
      new_is_paid = new_amount_paid >= Number(split.share_amount);
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