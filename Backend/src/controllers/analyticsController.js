import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createNotification } from './notificationController.js';

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

      // NOTIFIKASI: Hanya kirim jika health score turun drastis (misal >20 poin) atau masuk kategori 'Kritis'
      if (score < 50) {
        const { data: members } = await supabase
          .from('group_members')
          .select('profile_id')
          .eq('group_id', group_id)

        const COOLDOWN_HOURS = 24
        const cooldownTime = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()

        await Promise.all((members || []).map(async (m) => {
          // Cek apakah notifikasi health untuk user ini sudah dikirim dalam 24 jam terakhir
          const { data: recent } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', m.profile_id)
            .eq('type', 'health')
            .gte('created_at', cooldownTime)
            .limit(1)

          // Kalau belum ada, baru insert
          if (!recent || recent.length === 0) {
            await createNotification({
              user_id: m.profile_id,
              type:    'health',
              title:   'Kesehatan Keuangan Grup Kritis',
              message: `Skor grup kamu ${score}/100. Segera selesaikan hutang yang belum terbayar!`,
            })
          }
        }))
      }

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
    const conflicts = [];

    // Ambil semua bills
    const { data : bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('group_id', group_id);

    if (billsError) throw billsError;
    if (!bills?.length) {
      return res.status(200).json({
        success: true,
        group_id,
        conflict_count: 0,
        status: 'Aman',
        conflicts: []
      });
    }
    
    const billIds = bills.map(b => b.id);

    //Ambil semua splits
    const { data: splits, error: splitsError } = await supabase
      .from('bill_splits')
      .select('id, bill_id, member_id, share_amount, amount_paid, is_paid, created_at')
      .in('bill_id', billIds);

    if (splitsError) throw splitsError;
    if (!splits?.length) {
      return res.status(200).json({ 
        success: true,
        group_id,
        conflict_count: 0,
        status: 'Aman',
        conflicts: []
      })
    }

    // Resolve nama member
    const memberIds = [...new Set([
      ...splits.map(s => s.member_id),
      ...bills.map(b => b.payer_id),
    ])];
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, username').in('id', memberIds);
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || p.username || '—'; });

    // ── Konflik 1: Debt ratio sangat tinggi ─────────────────────────────
    const totalAmount  = splits.reduce((sum, s) => sum + Number(s.share_amount), 0);
    const unpaidAmount = splits
      .filter(s => !s.is_paid)
      .reduce((sum, s) => sum + Number(s.share_amount) - Number(s.amount_paid), 0);
    const debtRatio = totalAmount > 0 ? unpaidAmount / totalAmount : 0;

    if (debtRatio > 0.7) {
      conflicts.push({
        type: 'HIGH_DEBT_RATIO',
        severity: 'high',
        title: 'Tingkat Hutang Sangat Tinggi',
        description: `${Math.round(debtRatio * 100)}% dari total tagihan (Rp${Math.round(unpaidAmount).toLocaleString('id-ID')}) belum terbayar. Grup ini berisiko jika dibiarkan terlalu lama — segera lakukan rekonsiliasi bersama.`,
        involved_users: []
      });
    } else if (debtRatio > 0.4) {
      conflicts.push({
        type: 'MEDIUM_DEBT_RATIO',
        severity: 'medium',
        title: 'Hutang Mulai Menumpuk',
        description: `${Math.round(debtRatio * 100)}% dari total tagihan belum terbayar (Rp${Math.round(unpaidAmount).toLocaleString('id-ID')}). Sebaiknya segera dorong anggota untuk menyelesaikan kewajibannya.`,
        involved_users: []
      });
    }

    // ── Konflik 2: Satu anggota nanggung mayoritas biaya ────────────────
    const payerMap = {};
    bills.forEach(b => {
      payerMap[b.payer_id] = (payerMap[b.payer_id] || 0) + Number(b.amount);
    });
    const totalBillAmount = bills.reduce((sum, b) => sum + Number(b.amount), 0);
    const payerEntries = Object.entries(payerMap);

    if (payerEntries.length > 1) {
      for (const [payerId, paidAmount] of payerEntries) {
        const ratio = totalBillAmount > 0 ? paidAmount / totalBillAmount : 0;
        if (ratio > 0.6) {
          conflicts.push({
            type: 'PAYER_IMBALANCE',
            severity: 'medium',
            title: 'Beban Pembayaran Tidak Merata',
            description: `${profileMap[payerId] || 'Satu anggota'} menanggung ${Math.round(ratio * 100)}% dari seluruh pengeluaran grup (Rp${Math.round(paidAmount).toLocaleString('id-ID')}). Pertimbangkan rotasi giliran bayar di transaksi berikutnya.`,
            involved_users: [profileMap[payerId] || '—']
          });
          break;
        }
      }
    }

    // ── Konflik 3: Anggota yang belum pernah bayar sama sekali ──────────
    const memberPayMap = {};
    splits.forEach(s => {
      if (!memberPayMap[s.member_id]) memberPayMap[s.member_id] = { paid: 0, owed: 0 };
      memberPayMap[s.member_id].owed += Number(s.share_amount);
      memberPayMap[s.member_id].paid += Number(s.amount_paid);
    });

    const neverPaid = Object.entries(memberPayMap)
      .filter(([, v]) => v.owed > 0 && v.paid === 0)
      .map(([id]) => profileMap[id] || '—');

    if (neverPaid.length > 0) {
      conflicts.push({
        type: 'ZERO_PAYMENT_MEMBERS',
        severity: neverPaid.length >= 2 ? 'high' : 'medium',
        title: `${neverPaid.length} Anggota Belum Pernah Membayar`,
        description: `Anggota berikut punya hutang tapi belum pernah melakukan pembayaran apapun: ${neverPaid.join(', ')}. Segera komunikasikan sebelum hutang semakin menumpuk.`,
        involved_users: neverPaid
      });
    }


    // ── Konflik 4: Tagihan overdue > 30 hari belum lunas ────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const overdueSplits = splits.filter(s => !s.is_paid && s.created_at < thirtyDaysAgo);

    if (overdueSplits.length > 0) {
      const overdueAmount = overdueSplits.reduce(
        (sum, s) => sum + Number(s.share_amount) - Number(s.amount_paid), 0
      );
      conflicts.push({
        type: 'OVERDUE_BILLS',
        severity: 'medium',
        title: `${overdueSplits.length} Tagihan Belum Lunas Lebih dari 30 Hari`,
        description: `Total Rp${Math.round(overdueAmount).toLocaleString('id-ID')} dari tagihan yang sudah lebih dari 30 hari belum diselesaikan. Semakin lama dibiarkan, semakin sulit untuk ditagih.`,
        involved_users: []
      });
    }

    // ── Konflik 5: Ada anggota dengan hutang sangat besar dibanding lainnya
    const memberDebts = Object.entries(memberPayMap)
      .filter(([, v]) => v.owed > v.paid)
      .map(([id, v]) => ({ id, name: profileMap[id] || '—', debt: v.owed - v.paid }))
      .sort((a, b) => b.debt - a.debt);

    if (memberDebts.length >= 2) {
      const maxDebt = memberDebts[0].debt;
      const avgDebt = memberDebts.reduce((s, m) => s + m.debt, 0) / memberDebts.length;
      if (maxDebt > avgDebt * 2.5) {
        conflicts.push({
          type: 'DEBT_CONCENTRATION',
          severity: 'medium',
          title: 'Konsentrasi Hutang pada Satu Anggota',
          description: `${memberDebts[0].name} memiliki hutang Rp${Math.round(maxDebt).toLocaleString('id-ID')} — jauh lebih besar dari rata-rata anggota lain (Rp${Math.round(avgDebt).toLocaleString('id-ID')}). Perlu perhatian khusus agar tidak menghambat keseimbangan grup.`,
          involved_users: [memberDebts[0].name]
        });
      }
    }

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


// GET /api/v1/analytics/:group_id/conflict-status  
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