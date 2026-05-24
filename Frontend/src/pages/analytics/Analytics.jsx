import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Info,
  Lightbulb, Activity, Users, BarChart2, PieChart, RefreshCw,
  ChevronDown, Zap, Target, Shield, Clock, ArrowUpRight,
  ArrowDownRight, Minus, TrendingDown, CreditCard, Hash,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { fmt } from "../../utils/format";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navyDark: "#121358",
  navy:     "#232F72",
  blue:     "#2F578A",
  teal:     "#36ADA3",
  bg:       "#f0f2f8",
};

// ─── Score helpers ────────────────────────────────────────────────────────────
const scoreConfig = (score) => {
  if (score >= 80) return { textColor: C.teal,    bg: `${C.teal}18`,           bar: C.teal,    label: "Sangat Sehat",    icon: CheckCircle,    ring: `${C.teal}30`   };
  if (score >= 60) return { textColor: C.blue,    bg: `${C.blue}18`,           bar: C.blue,    label: "Cukup Sehat",     icon: Activity,       ring: `${C.blue}30`   };
  if (score >= 40) return { textColor: "#f59e0b", bg: "rgba(245,158,11,0.12)", bar: "#f59e0b", label: "Perlu Perhatian", icon: AlertTriangle,  ring: "rgba(245,158,11,0.2)" };
  return             { textColor: "#ef4444", bg: "rgba(239,68,68,0.12)",  bar: "#ef4444", label: "Kritis",          icon: XCircle,        ring: "rgba(239,68,68,0.2)"  };
};

const severityConfig = (s) => ({
  high:   { bg: "#fff5f5", border: "#fecaca", dot: "#f87171", badge: { bg: "#fee2e2", text: "#b91c1c" }, label: "Tinggi"  },
  medium: { bg: "#fffbeb", border: "#fde68a", dot: "#fbbf24", badge: { bg: "#fef3c7", text: "#92400e" }, label: "Sedang" },
  low:    { bg: "#eff6ff", border: "#bfdbfe", dot: "#60a5fa", badge: { bg: "#dbeafe", text: "#1e40af" }, label: "Rendah" },
}[s] ?? { bg: "#eff6ff", border: "#bfdbfe", dot: "#60a5fa", badge: { bg: "#dbeafe", text: "#1e40af" }, label: s ?? "-" });

// ─── Skeletons ────────────────────────────────────────────────────────────────
const Sk = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-white/60 ${className}`} />
);

// ─── Score Gauge ──────────────────────────────────────────────────────────────
function ScoreGauge({ score }) {
  const r    = 56;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(Math.max(score ?? 0, 0), 100);
  const offset = circ - (pct / 100) * circ;
  const cfg  = scoreConfig(pct);
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Glow ring */}
        <div className="absolute rounded-full"
          style={{ width: 148, height: 148, backgroundColor: cfg.ring }} />
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={cfg.bar} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-black tracking-tight" style={{ color: C.navyDark }}>{pct}</span>
          <span className="text-xs text-gray-400 font-medium">/ 100</span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
        style={{ backgroundColor: cfg.bg, color: cfg.textColor }}>
        <Icon size={12} />
        {cfg.label}
      </div>
    </div>
  );
}

// ─── Breakdown bar ────────────────────────────────────────────────────────────
function BreakdownBar({ label, value, max = 100 }) {
  const pct   = Math.min(100, Math.round(((value ?? 0) / max) * 100));
  const color = pct >= 70 ? C.teal : pct >= 50 ? C.blue : "#f59e0b";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: C.navyDark }}>{value ?? 0}</span>
          <span className="text-xs text-gray-400">/ {max}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight" style={{ color: C.navyDark }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs font-medium"
          style={{ color: trend > 0 ? C.teal : trend < 0 ? "#ef4444" : "#9ca3af" }}>
          {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
          <span>{trend > 0 ? `+${trend}` : trend}% vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}

// ─── Conflict card ────────────────────────────────────────────────────────────
function ConflictCard({ conflict, idx }) {
  const s = severityConfig(conflict.severity);
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${s.dot}` }}>
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: s.dot }}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-bold text-gray-800">{conflict.title || conflict.type}</p>
            <span className="shrink-0 rounded-full px-3 py-0.5 text-xs font-bold"
              style={{ backgroundColor: s.badge.bg, color: s.badge.text }}>
              {s.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {conflict.description || conflict.message}
          </p>
          {conflict.involved_users?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              <Users size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">{conflict.involved_users.join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Generate insights & recommendations (frontend logic, no dummy data) ──────
function generateInsights(health, conflicts) {
  const insights = [];
  const score = health?.score ?? 0;

  if (score >= 80) {
    insights.push({ type: "achievement", title: "Grup Sangat Sehat!", summary: `Health score grup ${score}/100 — pembayaran berjalan lancar dan merata.`, detail: "Pertahankan pola ini agar keuangan grup tetap transparan dan adil." });
  } else if (score >= 60) {
    insights.push({ type: "info", title: "Grup Cukup Sehat", summary: `Health score ${score}/100 — ada beberapa hal yang perlu diperhatikan.`, detail: "Cek tab Konflik untuk melihat apa yang perlu diperbaiki." });
  } else if (score >= 40) {
    insights.push({ type: "warning", title: "Perlu Perhatian", summary: `Health score ${score}/100 — kondisi keuangan grup kurang seimbang.`, detail: "Segera selesaikan hutang yang tertunggak dan perhatikan distribusi pembayaran." });
  } else {
    insights.push({ type: "negative", title: "Kondisi Kritis", summary: `Health score ${score}/100 — ada masalah serius dalam grup.`, detail: "Segera komunikasikan dengan anggota grup dan selesaikan hutang yang ada." });
  }

  const activeDebts = health?.active_debts ?? 0;
  if (activeDebts > 0) {
    insights.push({ type: "warning", title: "Ada Hutang Belum Lunas", summary: `${activeDebts} hutang aktif belum diselesaikan dalam grup.`, detail: "Gunakan fitur Simplify Debt untuk meminimalkan jumlah transfer yang diperlukan." });
  }

  if (conflicts?.length > 0) {
    const highConflicts = conflicts.filter(c => c.severity === "high").length;
    if (highConflicts > 0) {
      insights.push({ type: "warning", title: `${highConflicts} Konflik Prioritas Tinggi`, summary: "Ada ketidakseimbangan signifikan dalam pembayaran grup.", detail: "Lihat tab Konflik untuk detail dan segera diskusikan dengan anggota." });
    }
  }

  const totalMembers  = health?.total_members ?? 0;
  const activeMembers = health?.active_members ?? 0;
  if (totalMembers > 0 && activeMembers < totalMembers) {
    insights.push({ type: "info", title: "Ada Anggota Tidak Aktif", summary: `${totalMembers - activeMembers} dari ${totalMembers} anggota belum aktif bertransaksi.`, detail: "Ajak semua anggota untuk ikut mencatat transaksi agar data lebih akurat." });
  }

  return insights;
}

function generateRecommendations(health, conflicts) {
  const recs = [];
  const score = health?.score ?? 0;
  const activeDebts = health?.active_debts ?? 0;

  if (activeDebts > 0) {
    recs.push({ title: "Selesaikan Hutang dengan Simplify Debt", description: `Ada ${activeDebts} hutang aktif. Gunakan fitur Simplify Debt untuk meminimalkan jumlah transfer yang diperlukan antar anggota.`, impact: "high", action_label: "Buka Simplify Debt" });
  }

  if (conflicts?.some(c => c.severity === "high")) {
    recs.push({ title: "Seimbangkan Giliran Pembayaran", description: "Terdeteksi ketidakseimbangan dalam siapa yang sering membayar duluan. Diskusikan agar semua anggota bergantian menalangi.", impact: "high", action_label: "Lihat detail konflik" });
  }

  if (score < 60) {
    recs.push({ title: "Rutin Catat Semua Transaksi", description: "Pastikan setiap pengeluaran bersama langsung dicatat di Talang.in agar perhitungan selalu akurat dan transparan.", impact: "medium" });
  }

  recs.push({ title: "Gunakan AI Input untuk Transaksi", description: 'Coba input transaksi dengan bahasa natural seperti "Geprek 75 ribu buat 3 orang, aku yang bayar" — lebih cepat dan mudah.', impact: "low", action_label: "Coba sekarang" });

  return recs;
}

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ insight }) {
  const [open, setOpen] = useState(false);
  const map = {
    tip:         { icon: Lightbulb,      color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    warning:     { icon: AlertTriangle,  color: "#ef4444", bg: "#fff5f5", border: "#fecaca" },
    info:        { icon: Info,           color: C.blue,    bg: "#eff6ff", border: "#bfdbfe" },
    achievement: { icon: CheckCircle,    color: C.teal,    bg: `${C.teal}10`, border: `${C.teal}30` },
    positive:    { icon: TrendingUp,     color: C.teal,    bg: `${C.teal}10`, border: `${C.teal}30` },
    negative:    { icon: ArrowDownRight, color: "#ef4444", bg: "#fff5f5", border: "#fecaca" },
  };
  const s    = map[insight.type] ?? map.info;
  const Icon = s.icon;
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${s.color}` }}>
      <button className="flex w-full items-start gap-4 p-5 text-left"
        onClick={() => setOpen(p => !p)}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: s.bg }}>
          <Icon size={15} style={{ color: s.color }} />
        </div>
        <div className="flex-1 min-w-0">
          {insight.title && <p className="text-sm font-bold text-gray-800 mb-0.5">{insight.title}</p>}
          <p className="text-sm text-gray-500">{insight.summary || insight.message}</p>
        </div>
        {insight.detail && (
          <ChevronDown size={15} className={`shrink-0 mt-1 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && insight.detail && (
        <div className="px-5 pb-5 pt-0 pl-[68px]">
          <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">{insight.detail}</p>
        </div>
      )}
    </div>
  );
}

// ─── Rec card ─────────────────────────────────────────────────────────────────
function RecCard({ rec, idx }) {
  const impactMap = {
    high:   { color: C.teal,    bg: `${C.teal}15`,    label: "Prioritas" },
    medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Sedang"    },
    low:    { color: "#9ca3af", bg: "#f3f4f6",         label: "Opsional"  },
  };
  const imp = impactMap[rec.impact] ?? impactMap.low;
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white text-sm font-black"
        style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>{idx + 1}</div>
      <div className="flex-1 min-w-0">
        {rec.title && <p className="text-sm font-bold text-gray-800 mb-1">{rec.title}</p>}
        <p className="text-sm text-gray-500 leading-relaxed">{rec.description}</p>
        {rec.action_label && (
          <button className="mt-3 flex items-center gap-1.5 text-xs font-bold hover:underline transition-all"
            style={{ color: C.teal }}>
            {rec.action_label} <ArrowUpRight size={11} />
          </button>
        )}
      </div>
      <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
        style={{ backgroundColor: imp.bg, color: imp.color }}>
        {imp.label}
      </span>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <Icon size={28} className="text-gray-300" />
      </div>
      <p className="font-semibold text-gray-400">{title}</p>
      {sub && <p className="text-sm text-gray-300">{sub}</p>}
    </div>
  );
}

// ─── Trend bars ───────────────────────────────────────────────────────────────
function TrendBars({ data }) {
  if (!data?.length) return <Empty icon={BarChart2} title="Belum ada data tren" />;
  const max = Math.max(...data.map(d => d.amount ?? 0), 1);
  return (
    <div className="space-y-3">
      {data.slice(-6).map(m => {
        const pct = Math.round(((m.amount ?? 0) / max) * 100);
        return (
          <div key={m.month} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-xs text-gray-400 font-medium">{m.month}</span>
            <div className="flex-1 h-6 rounded-xl bg-gray-50 overflow-hidden">
              <div className="h-full rounded-xl transition-all duration-700 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(pct, 4)}%`, background: `linear-gradient(90deg, ${C.navy}, ${C.teal})` }}>
              </div>
            </div>
            <span className="w-28 shrink-0 text-right text-xs text-gray-500 font-bold">{fmt(m.amount)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Member grid ──────────────────────────────────────────────────────────────
function MemberGrid({ members }) {
  if (!members?.length) return <Empty icon={Users} title="Belum ada data kontribusi" />;

  const avatarColors = [C.navy, C.teal, C.blue, "#7c3aed", "#db2777", "#d97706"];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {members.map((m, i) => {
        const net  = (m.paid ?? 0) - (m.owed ?? 0);
        const pos  = net > 0;
        const zero = net === 0;
        return (
          <div key={m.user_id}
            className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white"
              style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
              {(m.name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 truncate">{m.name ?? "-"}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pos ? "Berlebih membayar" : zero ? "Seimbang" : "Masih hutang"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
              {zero
                ? <Minus size={12} className="text-gray-300" />
                : pos
                ? <ArrowUpRight size={12} style={{ color: C.teal }} />
                : <ArrowDownRight size={12} className="text-red-400" />}
              <span className="text-xs font-black"
                style={{ color: zero ? "#d1d5db" : pos ? C.teal : "#f87171" }}>
                {fmt(Math.abs(net))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Top Category dot list ────────────────────────────────────────────────────
function CategoryList({ categories }) {
  if (!categories?.length) return <Empty icon={PieChart} title="Belum ada data kategori" />;
  const colors = [C.teal, C.navy, C.blue, "#f59e0b", "#ef4444"];
  const total  = categories.reduce((a, c) => a + (c.amount ?? 0), 0) || 1;

  return (
    <div className="space-y-3">
      {categories.slice(0, 5).map((cat, i) => {
        const pct = Math.round(((cat.amount ?? 0) / total) * 100);
        return (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
                <span className="text-sm text-gray-600">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold" style={{ color: colors[i] }}>{cat.percentage ?? pct}%</span>
                <span className="text-xs text-gray-400 w-24 text-right">{fmt(cat.amount)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${cat.percentage ?? pct}%`, backgroundColor: colors[i] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { user }                          = useAuth();
  const [groups, setGroups]               = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading]             = useState({ groups: true, analytics: false });
  const [error, setError]                 = useState({ groups: null, analytics: null });
  const [data, setData]                   = useState(null);
  const [activeTab, setActiveTab]         = useState("overview");

  useEffect(() => {
    if (!user?.id) return;
    const fetchGroups = async () => {
      setLoading(p => ({ ...p, groups: true }));
      try {
        // Gunakan endpoint grup milik user, bukan semua grup
        const res = await api.get(`/groups/user/${user.id}`);
        const raw = res.data?.data ?? res.data ?? [];
        // Response: [{ role, joined_at, groups: { id, group_name } }]
        const list = raw.map(item => ({
          id:   item.groups?.id   || item.id,
          name: item.groups?.group_name || item.name || "—",
        }));
        setGroups(list);
        if (list.length > 0) setSelectedGroup(list[0]);
      } catch (e) {
        setError(p => ({ ...p, groups: e?.response?.data?.message ?? "Gagal memuat grup." }));
      } finally {
        setLoading(p => ({ ...p, groups: false }));
      }
    };
    fetchGroups();
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedGroup) return;
    setLoading(p => ({ ...p, analytics: true }));
    setError(p => ({ ...p, analytics: null }));
    setData(null);
    try {
      const groupId = selectedGroup.id;
      const [healthRes, conflictRes, dashRes] = await Promise.allSettled([
        api.get(`/analytics/${groupId}/health`),
        api.get(`/analytics/${groupId}/conflicts`),
        api.get(`/analytics/${groupId}/dashboard`),
      ]);
      // Normalize health: backend returns { health_score, label, narrative, detail }
      const healthRaw  = healthRes.status === "fulfilled" ? healthRes.value.data : null;
      const health     = healthRaw ? {
        score:          healthRaw.health_score ?? 0,
        label:          healthRaw.label,
        narrative:      healthRaw.narrative,
        total_splits:   healthRaw.detail?.total_splits ?? 0,
        paid:           healthRaw.detail?.paid ?? 0,
        unpaid:         healthRaw.detail?.unpaid ?? 0,
        debt_ratio:     healthRaw.detail?.debt_ratio ?? 0,
      } : null;

      // Normalize conflicts: backend returns { conflicts: [...] }
      const conflictRaw = conflictRes.status === "fulfilled" ? conflictRes.value.data : null;
      const conflicts   = conflictRaw?.conflicts ?? [];

      // Normalize dashboard: backend returns { summary, categories, monthly_trend }
      const dashRaw  = dashRes.status === "fulfilled" ? dashRes.value.data : null;
      const dashboard = dashRaw ? {
        total_bills:   dashRaw.summary?.total_bills  ?? 0,
        total_amount:  dashRaw.summary?.total_amount ?? 0,
        // Normalize categories: backend uses { category, total, percentage }, frontend uses { name, amount, percentage }
        top_categories: (dashRaw.categories ?? []).map(c => ({
          name:       c.category,
          amount:     c.total,
          percentage: c.percentage,
        })),
        // Normalize monthly_trend: backend uses { month, total }, frontend uses { month, amount }
        monthly_trend: (dashRaw.monthly_trend ?? []).map(m => ({
          month:  m.month,
          amount: m.total,
        })),
      } : null;

      const mergedHealth = { ...(health ?? {}), ...(dashboard ?? {}), score: health?.score ?? 0 };
      const insights        = generateInsights(mergedHealth, conflicts);
      const recommendations = generateRecommendations(mergedHealth, conflicts);
      setData({ health: mergedHealth, conflicts, insights, recommendations });
    } catch (e) {
      setError(p => ({ ...p, analytics: e?.response?.data?.message ?? "Gagal memuat analitik." }));
    } finally {
      setLoading(p => ({ ...p, analytics: false }));
    }
  }, [selectedGroup]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const tabs = [
    { id: "overview",       label: "Overview",    icon: BarChart2,     countKey: null               },
    { id: "insight",        label: "Insight",     icon: Lightbulb,     countKey: "insights"         },
    { id: "conflict",       label: "Konflik",     icon: AlertTriangle, countKey: "conflicts"        },
    { id: "recommendation", label: "Rekomendasi", icon: Zap,           countKey: "recommendations"  },
  ];

  const health = data?.health;
  const score  = health?.score ?? 0;
  const cfg    = scoreConfig(score);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${C.teal}18` }}>
              <Activity size={20} style={{ color: C.teal }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.navyDark }}>Insight & Analytics</h1>
              <p className="text-xs text-gray-400">Health score, insight & rekomendasi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading.groups ? (
              <Sk className="h-9 w-40 rounded-xl" />
            ) : groups.length === 0 ? (
              <span className="text-xs text-gray-400">Belum ada grup</span>
            ) : (
              <div className="relative">
                <select
                  className="h-9 appearance-none pl-3 pr-8 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2"
                  style={{ color: C.navyDark }}
                  value={selectedGroup?.id ?? ""}
                  onChange={e => setSelectedGroup(groups.find(g => String(g.id) === e.target.value) ?? null)}
                >
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
            <button onClick={fetchAnalytics} disabled={loading.analytics}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition disabled:opacity-40">
              <RefreshCw size={14} className={`text-gray-500 ${loading.analytics ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 space-y-5 max-w-6xl w-full mx-auto">

        {!loading.groups && groups.length === 0 && (
          <Empty icon={PieChart} title="Belum ada grup" sub="Buat grup dulu di halaman Grup" />
        )}

        {loading.analytics && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Sk className="h-64" />
              <div className="md:col-span-2 space-y-3">
                {[1,2,3,4].map(i => <Sk key={i} className="h-12" />)}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Sk key={i} className="h-28" />)}
            </div>
          </div>
        )}

        {!loading.analytics && error.analytics && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <XCircle size={32} className="text-red-400" />
            <p className="text-sm text-gray-400">{error.analytics}</p>
            <button onClick={fetchAnalytics}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        )}

        {!loading.analytics && data && (
          <div className="space-y-5">

            {/* ── Health Score + Breakdown ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Score card */}
              <div className="rounded-2xl bg-white border shadow-sm flex flex-col items-center justify-between gap-5 p-6"
                style={{ borderColor: `${cfg.textColor}20` }}>
                <div className="flex items-center gap-2 self-start">
                  <Shield size={14} style={{ color: C.teal }} />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Health Score</span>
                </div>
                <ScoreGauge score={score} />
                <div className="w-full rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-medium text-gray-400"
                  style={{ backgroundColor: C.bg }}>
                  <Clock size={11} />
                  <span>Diperbarui baru saja</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="md:col-span-2 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2 size={14} style={{ color: C.teal }} />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Rincian Skor</span>
                </div>
                <div className="space-y-5">
                  <BreakdownBar label="Kelancaran Pembayaran"    value={health?.payment_smoothness     ?? Math.round(score * 0.3)}  />
                  <BreakdownBar label="Partisipasi Anggota"      value={health?.member_participation   ?? Math.round(score * 0.25)} />
                  <BreakdownBar label="Keseimbangan Beban"       value={health?.balance_equity         ?? Math.round(score * 0.25)} />
                  <BreakdownBar label="Konsistensi Transaksi"    value={health?.transaction_consistency ?? Math.round(score * 0.2)} />
                </div>
              </div>
            </div>

            {/* ── Stat Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Transaksi"   value={health?.total_transactions ?? 0}  sub="dalam grup"                                    icon={Hash}       color={C.blue}    />
              <StatCard label="Total Pengeluaran" value={fmt(health?.total_spending)}       sub="keseluruhan"                                   icon={TrendingUp} color={C.teal}    />
              <StatCard label="Hutang Aktif"      value={health?.active_debts ?? 0}         sub="belum lunas"                                   icon={CreditCard} color="#f59e0b"   />
              <StatCard label="Anggota Aktif"     value={health?.active_members ?? 0}       sub={`dari ${health?.total_members ?? 0} anggota`}  icon={Users}      color={C.navy}    />
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────── */}
            <div className="flex gap-1.5 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
              {tabs.map(({ id, label, icon: Icon, countKey }) => {
                const count = countKey ? data[countKey]?.length : undefined;
                const isActive = activeTab === id;
                return (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-bold transition-all"
                    style={{
                      backgroundColor: isActive ? C.navyDark : "transparent",
                      color: isActive ? "white" : "#9ca3af",
                    }}>
                    <Icon size={14} />
                    <span className="hidden sm:inline">{label}</span>
                    {count !== undefined && count > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-black leading-none"
                        style={{
                          backgroundColor: isActive ? "rgba(255,255,255,0.2)" : id === "conflict" ? "rgba(239,68,68,0.1)" : `${C.teal}18`,
                          color: isActive ? "white" : id === "conflict" ? "#ef4444" : C.teal,
                        }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Tab: Overview ────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={14} style={{ color: C.teal }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Tren Pengeluaran</span>
                  </div>
                  <TrendBars data={health?.monthly_trend} />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <PieChart size={14} style={{ color: C.teal }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Kategori Terbesar</span>
                  </div>
                  <CategoryList categories={health?.top_categories} />
                </div>

                <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Users size={14} style={{ color: C.teal }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Kontribusi Anggota</span>
                  </div>
                  <MemberGrid members={health?.member_contributions} />
                </div>
              </div>
            )}

            {/* ── Tab: Insight ─────────────────────────────────────────── */}
            {activeTab === "insight" && (
              <div className="space-y-3">
                {data.insights.length === 0 ? (
                  <Empty icon={Lightbulb} title="Belum ada insight" sub="Tambah lebih banyak transaksi untuk mulai melihat pola." />
                ) : (
                  data.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)
                )}
              </div>
            )}

            {/* ── Tab: Konflik ─────────────────────────────────────────── */}
            {activeTab === "conflict" && (
              <div className="space-y-3">
                {data.conflicts.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${C.teal}15` }}>
                      <CheckCircle size={28} style={{ color: C.teal }} />
                    </div>
                    <p className="font-bold text-gray-500">Tidak ada konflik terdeteksi</p>
                    <p className="text-sm text-gray-400">Grup ini berjalan dengan sangat baik!</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={13} className="text-amber-400" />
                      <span className="text-xs text-gray-400 font-medium">{data.conflicts.length} konflik terdeteksi</span>
                    </div>
                    {data.conflicts.map((c, i) => <ConflictCard key={i} conflict={c} idx={i} />)}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Rekomendasi ─────────────────────────────────────── */}
            {activeTab === "recommendation" && (
              <div className="space-y-3">
                {data.recommendations.length === 0 ? (
                  <Empty icon={Zap} title="Tidak ada rekomendasi saat ini" sub="Grup sudah berjalan dengan baik!" />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={13} style={{ color: C.teal }} />
                      <span className="text-xs text-gray-400 font-medium">{data.recommendations.length} rekomendasi tersedia</span>
                    </div>
                    {data.recommendations
                      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.impact] ?? 3) - ({ high: 0, medium: 1, low: 2 }[b.impact] ?? 3))
                      .map((r, i) => <RecCard key={i} rec={r} idx={i} />)}
                  </>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}