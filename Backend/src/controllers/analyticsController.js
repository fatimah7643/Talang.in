import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/v1/analytics/:group_id/health
export const getHealthScore = async (req, res) => {
  try {
    const { group_id } = req.params;

    // FIX: dua query terpisah lebih reliable dari join filter
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id')
      .eq('group_id', group_id);

    if (billsError) throw billsError;

    if (!bills || bills.length === 0) {
      return res.status(200).json({
        success: true,
        group_id,
        health_score: 100,
        label: 'Sempurna',
        narrative: 'Grup ini belum memiliki transaksi. Mulai catat pengeluaran pertama kalian!',
        detail: { total_splits: 0, paid: 0, unpaid: 0, debt_ratio: 0 }
      });
    }

    const billIds = bills.map(b => b.id);

    const { data: splits, error: splitsError } = await supabase
      .from('bill_splits')
      .select('share_amount, amount_paid, is_paid, member_id')
      .in('bill_id', billIds);

    if (splitsError) throw splitsError;

    const total = splits.length;
    if (total === 0) {
      return res.status(200).json({
        success: true,
        group_id,
        health_score: 100,
        label: 'Sempurna',
        narrative: 'Semua tagihan sudah lunas!',
        detail: { total_splits: 0, paid: 0, unpaid: 0, debt_ratio: 0 }
      });
    }

    const unpaidCount = splits.filter(s => !s.is_paid).length;
    const totalDebt   = splits.reduce((sum, s) => sum + (Number(s.share_amount) - Number(s.amount_paid)), 0);
    const totalBill   = splits.reduce((sum, s) => sum + Number(s.share_amount), 0);
    const debtRatio   = totalBill > 0 ? totalDebt / totalBill : 0;

    let score = Math.round((1 - debtRatio) * 100);
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    // Member contributions
    const memberIds = [...new Set(splits.map(s => s.member_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', memberIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || p.username || '—'; });

    const memberMap = {};
    splits.forEach(s => {
      if (!memberMap[s.member_id]) {
        memberMap[s.member_id] = { user_id: s.member_id, name: profileMap[s.member_id] || '—', paid: 0, owed: 0 };
      }
      memberMap[s.member_id].owed += Number(s.share_amount);
      memberMap[s.member_id].paid += Number(s.amount_paid);
    });
    const member_contributions = Object.values(memberMap);

    // Member stats
    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('profile_id')
      .eq('group_id', group_id);

    const total_members  = groupMembers?.length ?? 0;
    const active_members = memberIds.length;

    let label, narrative;
    if (score >= 80) {
      label     = 'Sehat';
      narrative = `Keuangan grup kalian sangat sehat! ${total - unpaidCount} dari ${total} tagihan sudah lunas. Pertahankan! 💪`;
    } else if (score >= 50) {
      label     = 'Perlu Perhatian';
      narrative = `Masih ada ${unpaidCount} tagihan belum lunas. Yuk segera selesaikan! ⚠️`;
    } else {
      label     = 'Kritis';
      narrative = `Tingkat utang grup sangat tinggi (${Math.round(debtRatio * 100)}% belum terbayar). Segera lakukan rekonsiliasi! 🚨`;
    }

    await supabase
      .from('group_analytics')
      .upsert({ group_id, health_score: score }, { onConflict: 'group_id' });

    return res.status(200).json({
      success: true,
      group_id,
      health_score: score,
      label,
      narrative,
      member_contributions,
      total_members,
      active_members,
      detail: {
        total_splits: total,
        paid:         total - unpaidCount,
        unpaid:       unpaidCount,
        debt_ratio:   debtRatio
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/:group_id/conflicts
export const getConflicts = async (req, res) => {
  try {
    const { group_id } = req.params;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('group_id', group_id)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const conflicts = [];
    const seen = {};

    (logs || []).forEach(log => {
      if (log.action_type !== 'BILL_CREATED') return;
      const meta = log.metadata || {};
      const key = `${meta.amount}_${meta.category}`;

      if (seen[key]) {
        conflicts.push({
          type: 'DUPLICATE_TRANSACTION',
          severity: 'warning',
          message: `Terdeteksi kemungkinan tagihan duplikat: kategori "${meta.category}" dengan nominal Rp${Number(meta.amount).toLocaleString()} dicatat lebih dari sekali dalam 24 jam.`,
          log_ids: [seen[key].id, log.id],
          timestamps: [seen[key].created_at, log.created_at]
        });
      } else {
        seen[key] = log;
      }
    });

    return res.status(200).json({
      success: true,
      group_id,
      conflict_count: conflicts.length,
      status: conflicts.length === 0 ? 'Aman' : 'Ada Potensi Konflik',
      conflicts
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/:group_id/conflict-status  (versi simpel dari app.js lama)
export const getConflictStatus = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from('bill_splits')
      .select('*, bills!inner(group_id)')
      .eq('bills.group_id', group_id)
      .eq('is_paid', false);

    if (error) throw error;

    let conflict_level = 'Low';
    if (data.length >= 5) conflict_level = 'Medium';
    if (data.length >= 10) conflict_level = 'High';

    return res.status(200).json({
      success: true,
      unpaid_bills: data.length,
      conflict_level
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/:group_id/dashboard
export const getDashboard = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data: bills, error } = await supabase
      .from('bills')
      .select('amount, category, created_at')
      .eq('group_id', group_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalAmount = bills.reduce((sum, b) => sum + Number(b.amount), 0);

    const categoryMap = {};
    bills.forEach(b => {
      const cat = b.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(b.amount);
    });

    const categories = Object.entries(categoryMap)
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalAmount > 0 ? Math.round((total / totalAmount) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    const monthMap = {};
    bills.forEach(b => {
      const month = b.created_at.slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + Number(b.amount);
    });

    const monthly_trend = Object.entries(monthMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return res.status(200).json({
      success: true,
      group_id,
      summary: { total_bills: bills.length, total_amount: totalAmount },
      categories,
      monthly_trend
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};