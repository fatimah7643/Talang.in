import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Play, 
  Check, 
  Receipt, 
  Zap, 
  Shield, 
  BarChart2, 
  Users, 
  Home, 
  Star, 
  GraduationCap, 
  Plane, 
  Briefcase, 
  Building2, 
  UtensilsCrossed, 
  ClipboardList, 
  ArrowUpDown, 
  Clock, 
  TrendingUp, 
  MessageSquare, 
  User, 
  Landmark,
  PieChart,
  Activity,
  CheckCircle2,
} from 'lucide-react'


// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  bg: '#f8f9ff',
  bgCard: '#ffffff',
  primary: '#121358',
  primaryMid: '#232F72',
  accent: '#2F578A',
  teal: '#36ADA3',
  navy: '#121358',
  text: '#121358',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  amber: '#f59e0b',
}

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

    * { box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; }
    .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-18px) rotate(3deg); }
      66% { transform: translateY(-8px) rotate(-2deg); }
    }
    @keyframes floatB {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-24px) rotate(-4deg); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideRight {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes ticker {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes morphBlob {
      0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
      50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
      75% { border-radius: 60% 40% 60% 30% / 60% 30% 60% 40%; }
    }
    @keyframes pulse-soft {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes barGrow {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }

    .animate-float      { animation: float 6s ease-in-out infinite; }
    .animate-floatB     { animation: floatB 8s ease-in-out infinite; }
    .animate-fadeUp     { animation: fadeUp 0.7s ease forwards; }
    .animate-scaleIn    { animation: scaleIn 0.6s ease forwards; }
    .animate-slideRight { animation: slideRight 0.6s ease forwards; }
    .animate-ticker     { animation: ticker 28s linear infinite; }
    .animate-morphBlob  { animation: morphBlob 10s ease-in-out infinite; }
    .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }

    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; }
    .delay-500 { animation-delay: 0.5s; }
    .delay-600 { animation-delay: 0.6s; }

    .card-3d {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card-3d:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 60px rgba(18,19,88,0.12);
    }

    .teal-btn {
      background: linear-gradient(135deg, #36ADA3 0%, #2e9990 100%);
      transition: opacity 0.2s ease;
    }
    .teal-btn:hover { opacity: 0.9; }

    .gradient-text {
      background: linear-gradient(135deg, #36ADA3, #2F578A, #232F72);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradientShift 5s ease infinite;
    }

    .feature-pill {
      transition: all 0.25s ease;
    }
    .feature-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(54,173,163,0.15);
    }

    .stat-card { transition: all 0.3s ease; }
    .stat-card:hover { transform: translateY(-4px); }

    .bar-animate {
      transform-origin: bottom;
      animation: barGrow 0.8s ease forwards;
    }
  `}</style>
)

// ─── Counter Hook ─────────────────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

// ─── InView Hook ──────────────────────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect() }
    }, { threshold: 0.15, ...options })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options])
  return [ref, inView]
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('beranda')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = ['beranda', 'fitur', 'cara-kerja', 'dashboard-insight', 'tentang']
    const observers = sections.map((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.3 }
      )
      observer.observe(el)
      return observer
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  const navLinks = [
    { label: 'Beranda',    href: '#beranda'           },
    { label: 'Fitur',      href: '#fitur'             },
    { label: 'Cara Kerja', href: '#cara-kerja'        },
    { label: 'Insight',    href: '#dashboard-insight' },
    { label: 'Tentang',    href: '#tentang'           },
  ]

  return (
    <nav className="font-display fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{
      backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(18,19,88,0.07)' : 'none',
    }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#beranda" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Talang.in" className="w-9 h-9 object-contain" />
          <span className="font-bold text-xl" style={{ color: scrolled ? P.text : 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Talang.in
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const sectionId = link.href.replace('#', '')
            const isActive = activeSection === sectionId
            return (
              <a key={link.href} href={link.href}
                className="text-sm font-medium transition-all hover:opacity-60 relative"
                style={{ color: scrolled ? (isActive ? P.primary : P.textMuted) : 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif' }}>
                {link.label}
                {isActive && scrolled && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: P.teal }} />
                )}
              </a>
            )
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition hover:opacity-70"
            style={{ color: scrolled ? P.text : 'white' }}>
            Masuk
          </Link>
          <Link to="/register"
            className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition teal-btn shadow-md">
            Daftar Gratis
          </Link>
        </div>

        <button className="md:hidden text-xl" style={{ color: scrolled ? P.text : 'white' }}
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-6 py-4 flex flex-col gap-4 shadow-lg">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="text-sm font-medium" style={{ color: P.text }}>{link.label}</a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Link to="/login" className="text-sm font-medium text-center py-2" style={{ color: P.text }}>Masuk</Link>
            <Link to="/register" className="text-sm font-bold text-center py-2.5 rounded-xl text-white teal-btn">Daftar Gratis</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section id="beranda" className="relative min-h-screen flex items-center pt-20 overflow-hidden"
    style={{ background: `linear-gradient(160deg, ${P.navy} 0%, ${P.primaryMid} 55%, #1a3a6e 100%)` }}>

    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="animate-morphBlob absolute w-96 h-96 opacity-20 top-10 -left-20"
        style={{ background: `radial-gradient(circle, ${P.teal}60, transparent 70%)`, animationDuration: '10s' }} />
      <div className="animate-morphBlob absolute w-72 h-72 opacity-15 bottom-20 right-10"
        style={{ background: `radial-gradient(circle, ${P.accent}50, transparent 70%)`, animationDuration: '13s', animationDelay: '-4s' }} />
      <div className="animate-morphBlob absolute w-56 h-56 opacity-10 top-1/2 right-1/3"
        style={{ background: `radial-gradient(circle, ${P.teal}40, transparent 70%)`, animationDuration: '9s', animationDelay: '-7s' }} />
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="white" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>

    <div className="relative max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
      <div>
        <div className="animate-fadeUp inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
          style={{ backgroundColor: `rgba(54,173,163,0.15)`, color: P.teal, borderColor: `rgba(54,173,163,0.3)`, fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.05em' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ backgroundColor: P.teal }} />
          MANAJEMEN KEUANGAN GRUP
        </div>

        <h1 className="animate-fadeUp delay-100 font-display text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6"
          style={{ color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Kelola patungan<br />grup jadi lebih<br />
          <span className="gradient-text">mudah dan<br />transparan</span>
        </h1>

        <p className="animate-fadeUp delay-200 text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Talang.in membantu grup mencatat transaksi bersama, membagi tagihan otomatis, menghitung utang, dan memberi insight agar keuangan grup lebih adil.
        </p>

        <div className="animate-fadeUp delay-300 flex flex-col sm:flex-row gap-3 mb-10">
          <Link to="/register"
            className="teal-btn flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white transition shadow-lg"
            style={{ boxShadow: `0 8px 32px rgba(54,173,163,0.35)` }}>
            Mulai Gunakan Talang.in <ArrowRight size={16} />
          </Link>
          <a href="#cara-kerja"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold border transition hover:bg-white/10"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
            <Play size={14} fill="currentColor" className="mr-0.5" /> Lihat Cara Kerja
          </a>
        </div>

        <div className="animate-fadeUp delay-400 flex items-center gap-6 flex-wrap text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {['Mahasiswa', 'Anak Kos', 'Teman Liburan', 'Rekan Kerja'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: `rgba(54,173,163,0.25)`, color: P.teal }}>
                <Check size={10} strokeWidth={3} />
              </span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Floating Dashboard Preview */}
      <div className="hidden md:block animate-scaleIn delay-300">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl blur-3xl"
            style={{ background: `radial-gradient(ellipse, rgba(54,173,163,0.25) 0%, transparent 70%)`, transform: 'scale(1.1)' }} />

          <div className="animate-float relative bg-white rounded-3xl shadow-2xl p-6 border"
            style={{ borderColor: P.border, boxShadow: '0 32px 80px rgba(18,19,88,0.3)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-sm" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Dashboard Liburan Bali</p>
                <p className="text-xs" style={{ color: P.textMuted }}>Pembaruan terakhir: 2 jam lalu</p>
              </div>
              <div className="flex -space-x-2">
                {[['AN', P.teal], ['BK', P.amber], ['CP', P.accent]].map(([label, color], idx) => (
                  <div key={label} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: color, zIndex: 3 - idx }}>{label[0]}</div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: P.bg, color: P.textMuted, zIndex: 0 }}>+2</div>
              </div>
            </div>

            <div className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, rgba(54,173,163,0.12), rgba(47,87,138,0.08))`, border: `1px solid rgba(54,173,163,0.2)` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `rgba(54,173,163,0.15)`, color: P.teal }}>
                <Receipt size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: P.text }}>Tagihan Berhasil Dibagi</p>
                <p className="text-xs" style={{ color: P.textMuted }}>Rp1.200.000 oleh Budi</p>
              </div>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `rgba(54,173,163,0.15)`, color: P.teal }}>
                <Check size={12} strokeWidth={3} />
              </span>
            </div>

            <p className="text-3xl font-black mb-3" style={{ color: P.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Rp12.450.000</p>

            <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: `rgba(47,87,138,0.08)` }}>
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: P.accent }}>
                <Zap size={14} className="text-amber-500 shrink-0" /> Insight: Pembayaran grup belum seimbang
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: P.bg }}>
                <p className="text-xs font-bold mb-2 tracking-wider" style={{ color: P.textMuted }}>RINGKASAN UTANG</p>
                {[['Andi', '-Rp450k', true], ['Budi', '+Rp200k', false], ['Citra', '+Rp250k', false]].map(([n, v, minus]) => (
                  <div key={n} className="flex justify-between items-center text-xs py-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: minus ? '#ef4444' : P.teal, fontSize: '8px' }}>{n[0]}</div>
                      <span style={{ color: P.text }}>{n}</span>
                    </div>
                    <span className="font-bold" style={{ color: minus ? '#ef4444' : P.teal }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: P.bg }}>
                <p className="text-xs font-bold mb-2 tracking-wider" style={{ color: P.textMuted }}>GRAFIK PENGELUARAN</p>
                <div className="flex items-end gap-1 h-14">
                  {[30, 55, 40, 80, 50, 65, 45].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
                      height: `${h}%`,
                      background: i === 3
                        ? `linear-gradient(to top, ${P.primary}, ${P.teal})`
                        : `rgba(47,87,138,0.25)`,
                    }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7', color: P.amber }}>
                <Shield size={16} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: P.text }}>Health Score: 82/100</p>
                <p className="text-xs" style={{ color: P.textMuted }}>Grup dalam kondisi sehat</p>
              </div>
              <button className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg text-white"
                style={{ backgroundColor: P.amber }}>Lihat</button>
            </div>
          </div>

          <div className="animate-floatB absolute -left-10 top-20 bg-white rounded-2xl px-4 py-3 shadow-xl border"
            style={{ borderColor: P.border }}>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold" style={{ color: P.text }}>Split Otomatis</p>
                <p className="text-xs" style={{ color: P.teal }}>3 anggota</p>
              </div>
            </div>
          </div>
          <div className="animate-float absolute -right-8 bottom-28 bg-white rounded-2xl px-4 py-3 shadow-xl border"
            style={{ borderColor: P.border, animationDelay: '-3s' }}>
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold" style={{ color: P.text }}>Health Score</p>
                <p className="text-xs font-black" style={{ color: P.primary }}>82/100</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// ─── Ticker Banner ────────────────────────────────────────────────────────────
const TickerBanner = () => {
  const items = ['Split Bill Otomatis', 'Insight Grup', 'Simplify Debt', 'Health Score', 'Multi Grup', 'Riwayat Transaksi', 'Dashboard Analytics', 'Anti Konflik']
  return (
    <div className="py-4 overflow-hidden border-y" style={{ backgroundColor: P.teal, borderColor: `rgba(255,255,255,0.2)` }}>
      <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-6 text-sm font-bold text-white opacity-90"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const Stats = () => {
  const [ref, inView] = useInView()
  const users        = useCounter(50,  1800, inView)
  const transactions = useCounter(200, 2200, inView)
  const groups       = useCounter(30,  1600, inView)
  const satisfaction = useCounter(99,  1400, inView)

  const stats = [
    { value: users,        suffix: '+', label: 'Pengguna Aktif',     icon: <Users size={24} />,   color: P.primary },
    { value: transactions, suffix: '+', label: 'Transaksi Tercatat', icon: <Receipt size={24} />, color: P.teal    },
    { value: groups,       suffix: '+', label: 'Grup Aktif',         icon: <Home size={24} />,    color: P.accent  },
    { value: satisfaction, suffix: '%', label: 'Kepuasan Pengguna',  icon: <Star size={24} />,    color: P.amber   },
  ]

  return (
    <section ref={ref} className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="stat-card text-center p-6 rounded-2xl border"
              style={{ borderColor: `${s.color}20`, backgroundColor: `${s.color}06` }}>
              <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
              <div className="text-3xl md:text-4xl font-extrabold mb-1"
                style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {s.value.toLocaleString()}{s.suffix}
              </div>
              <div className="text-xs font-medium" style={{ color: P.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Kebutuhan ────────────────────────────────────────────────────────────────
const Kebutuhan = () => {
  const [ref, inView] = useInView()
  const items = [
    { icon: <GraduationCap size={24} />, title: 'Mahasiswa',     desc: 'Kelola uang kas organisasi, tugas kelompok, dan kebutuhan acara tanpa catatan tercecer.',   color: P.accent      },
    { icon: <Home size={24} />,          title: 'Anak Kos',      desc: 'Catat iuran listrik, air, WiFi, dan kebutuhan bersama tanpa bingung menagih.',               color: P.teal        },
    { icon: <Plane size={24} />,         title: 'Teman Liburan', desc: 'Bagi biaya transportasi, penginapan, tiket, dan makan selama perjalanan.',                   color: P.primary     },
    { icon: <Briefcase size={24} />,     title: 'Rekan Kerja',   desc: 'Urus makan siang bareng, kado, atau acara kantor dengan pembagian yang jelas.',               color: P.amber       },
    { icon: <Building2 size={24} />,     title: 'Komunitas',     desc: 'Transparansi iuran rutin dan pengeluaran acara komunitas dalam satu aplikasi.',              color: P.primaryMid  },
    { icon: <UtensilsCrossed size={24} />, title: 'Grup Makan',  desc: 'Split bill restoran secara instan, termasuk pajak, servis, dan anggota yang ikut.',          color: '#10b981'     },
  ]

  return (
    <section className="py-20" style={{ backgroundColor: P.bg }}>
      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: P.teal, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>UNTUK SIAPA?</p>
          <h2 className={`text-4xl font-extrabold mb-4 ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
            style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Cocok untuk berbagai<br />kebutuhan grup
          </h2>
          <p className={`${inView ? 'animate-fadeUp delay-200' : 'opacity-0'}`} style={{ color: P.textMuted }}>
            Dari urusan kos sampai liburan, Talang.in membantu patungan tetap rapi, adil, dan transparan.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={item.title}
              className={`card-3d bg-white rounded-2xl p-6 border cursor-default ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
              style={{ borderColor: P.border, animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.color}12`, color: item.color }}>{item.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{item.title}</h3>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: P.textMuted }}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Fitur Utama ──────────────────────────────────────────────────────────────
const Fitur = () => {
  const [ref, inView] = useInView()
  const features = [
    { tag: 'TRANSACTION', icon: <ClipboardList size={24} />, title: 'Catat Transaksi Patungan', desc: 'Simpan semua pengeluaran grup dalam satu tempat agar tidak tercecer di chat.',              color: P.primary    },
    { tag: 'AUTO SPLIT',  icon: <Zap size={24} />,          title: 'Split Bill Otomatis',       desc: 'Bagi tagihan ke anggota sesuai transaksi tanpa hitung manual sama sekali.',                  color: P.teal       },
    { tag: 'BALANCE',     icon: <BarChart2 size={24} />,    title: 'Ringkasan Utang',           desc: 'Lihat siapa harus membayar ke siapa dengan tampilan yang jelas dan ringkas.',                color: P.accent     },
    { tag: 'SETTLEMENT',  icon: <ArrowUpDown size={24} />,  title: 'Simplify Debt',             desc: 'Sederhanakan pembayaran agar utang antar anggota lebih mudah diselesaikan.',                color: P.amber      },
    { tag: 'HISTORY',     icon: <Clock size={24} />,        title: 'Riwayat Transaksi',         desc: 'Pantau semua catatan pengeluaran grup secara rapi, aman, dan transparan.',                  color: P.primaryMid },
    { tag: 'INSIGHT',     icon: <TrendingUp size={24} />,   title: 'Dashboard Analytics',       desc: 'Lihat pola pengeluaran, kategori terbesar, dan kondisi pembayaran grup.',                   color: '#10b981'    },
  ]

  return (
    <section id="fitur" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: P.teal, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>FITUR UNGGULAN</p>
          <h2 className={`text-4xl font-extrabold mb-4 ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
            style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Fitur utama untuk<br />patungan yang lebih rapi
          </h2>
          <p className={`${inView ? 'animate-fadeUp delay-200' : 'opacity-0'}`} style={{ color: P.textMuted }}>
            Semua kebutuhan dasar patungan grup tersedia dalam satu aplikasi yang mudah digunakan.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title}
              className={`card-3d relative overflow-hidden rounded-2xl p-6 border cursor-default ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
              style={{ borderColor: `${f.color}20`, animationDelay: `${i * 0.1}s` }}>
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ background: `radial-gradient(circle at top right, ${f.color}, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${f.color}12`, color: f.color }}>{f.icon}</div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full tracking-wider"
                    style={{ backgroundColor: `${f.color}12`, color: f.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: P.textMuted }}>{f.desc}</p>
                <div className="mt-4 h-0.5 rounded-full w-12" style={{ backgroundColor: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Dashboard Insight Section (pengganti AISection) ──────────────────────────
const DashboardInsight = () => {
  const [ref, inView] = useInView()

  const categories = [
    { label: 'Makan', pct: 42, color: P.teal    },
    { label: 'Transport', pct: 28, color: P.accent  },
    { label: 'Penginapan', pct: 20, color: P.amber   },
    { label: 'Lainnya', pct: 10, color: '#10b981' },
  ]

  const insightCards = [
    { icon: <PieChart size={20} />,   title: 'Breakdown Kategori',   desc: 'Lihat pengeluaran grup per kategori: makan, transport, penginapan, dan lainnya.',        color: P.primary  },
    { icon: <Activity size={20} />,   title: 'Tren Pengeluaran',     desc: 'Pantau pola pengeluaran harian dan mingguan agar grup lebih sadar finansial.',           color: P.teal     },
    { icon: <Shield size={20} />,     title: 'Health Score Grup',    desc: 'Nilai kesehatan keuangan grup dihitung otomatis berdasarkan keseimbangan pembayaran.',   color: P.amber    },
    { icon: <CheckCircle2 size={20} />, title: 'Status Pelunasan',   desc: 'Lacak siapa yang sudah bayar, belum, dan berapa sisa yang perlu diselesaikan.',          color: '#10b981'  },
  ]

  return (
    <section id="dashboard-insight" className="py-20 relative overflow-hidden" style={{ backgroundColor: P.bg }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-10 top-0 right-0 blur-3xl" style={{ backgroundColor: P.teal }} />
        <div className="absolute w-72 h-72 rounded-full opacity-8 bottom-0 left-0 blur-3xl" style={{ backgroundColor: P.accent }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: P.teal, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>SMART INSIGHT</p>
          <h2 className={`text-4xl font-extrabold mb-4 ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
            style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Lebih dari sekadar split bill
          </h2>
          <p className={`max-w-lg mx-auto ${inView ? 'animate-fadeUp delay-200' : 'opacity-0'}`} style={{ color: P.textMuted }}>
            Talang.in memberi kamu gambaran lengkap kondisi keuangan grup — siapa berhutang, siapa piutang, dan bagaimana trennya.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          {/* Dashboard Analytics Card */}
          <div className={`md:col-span-2 bg-white rounded-3xl p-5 border shadow-xl ${inView ? 'animate-scaleIn' : 'opacity-0'}`}
            style={{ borderColor: P.border }}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: P.border }}>
              <div>
                <p className="text-xs font-bold" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Analytics Grup</p>
                <p className="text-xs" style={{ color: P.textMuted }}>Liburan Bali · 8 anggota</p>
              </div>
              <div className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ backgroundColor: `rgba(54,173,163,0.1)`, color: P.teal }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ backgroundColor: P.teal }} />
                Live
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="mb-4">
              <p className="text-xs font-bold mb-3 tracking-wider" style={{ color: P.textMuted }}>PENGELUARAN 7 HARI</p>
              <div className="flex items-end gap-1.5 h-20">
                {[['Sen', 35], ['Sel', 58], ['Rab', 42], ['Kam', 85], ['Jum', 62], ['Sab', 90], ['Min', 47]].map(([day, h], i) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm" style={{
                      height: `${h}%`,
                      background: i === 5
                        ? `linear-gradient(to top, ${P.primary}, ${P.teal})`
                        : i === 3
                          ? `linear-gradient(to top, ${P.accent}, ${P.teal}90)`
                          : `rgba(47,87,138,0.18)`,
                    }} />
                    <span className="text-xs" style={{ color: P.textMuted, fontSize: '9px' }}>{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <p className="text-xs font-bold mb-2 tracking-wider" style={{ color: P.textMuted }}>KATEGORI PENGELUARAN</p>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: P.text }}>{cat.label}</span>
                    <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: `${cat.color}20` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Health score summary */}
            <div className="mt-4 rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7', color: P.amber }}>
                <Shield size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: P.text }}>Health Score: 82/100</p>
                <div className="h-1 rounded-full mt-1" style={{ backgroundColor: `rgba(18,19,88,0.08)` }}>
                  <div className="h-full rounded-full" style={{ width: '82%', background: `linear-gradient(to right, ${P.amber}, ${P.teal})` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Insight feature cards */}
          <div className="md:col-span-3 grid grid-cols-2 gap-4">
            {insightCards.map((f, i) => (
              <div key={f.title}
                className={`card-3d bg-white rounded-2xl p-5 border cursor-default ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
                style={{ borderColor: P.border, animationDelay: `${i * 0.1 + 0.2}s` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${f.color}12`, color: f.color }}>{f.icon}</div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: P.textMuted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Cara Kerja ───────────────────────────────────────────────────────────────
const CaraKerja = () => {
  const [ref, inView] = useInView()
  const steps = [
    { num: 1, icon: <User size={24} />,         title: 'Buat Grup',         desc: 'Buat ruang patungan untuk kos, liburan, kerja tim, atau acara bersama.',     color: P.primary  },
    { num: 2, icon: <Users size={24} />,         title: 'Tambahkan Anggota', desc: 'Masukkan teman yang ikut dalam pengeluaran dan pembagian tagihan.',           color: P.teal     },
    { num: 3, icon: <ClipboardList size={24} />, title: 'Catat Transaksi',   desc: 'Input pengeluaran grup dengan mudah dan cepat langsung dari aplikasi.',      color: P.accent   },
    { num: 4, icon: <Zap size={24} />,           title: 'Hitung Otomatis',   desc: 'Sistem menghitung porsi, balance, dan rekomendasi pembayaran tiap anggota.', color: P.amber    },
    { num: 5, icon: <BarChart2 size={24} />,     title: 'Lihat Insight',     desc: 'Pantau utang, histori, tren, dan health score grup dari dashboard.',         color: '#10b981'  },
  ]

  return (
    <section id="cara-kerja" className="py-24 relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${P.navy} 0%, ${P.primaryMid} 60%, #1a4a6e 100%)` }}>

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: P.teal, filter: 'blur(80px)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: P.teal, filter: 'blur(80px)' }} />
        {/* Dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cw-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cw-dots)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest mb-3"
            style={{ color: P.teal, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            CARA KERJA
          </p>
          <h2 className={`text-4xl font-extrabold mb-4 text-white ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Cara kerja Talang.in
          </h2>
          <p className={`text-sm ${inView ? 'animate-fadeUp delay-200' : 'opacity-0'}`}
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            Mulai dari membuat grup sampai melihat insight keuangan, semuanya dibuat sederhana.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">

        {/* ── Arrow connector (desktop only) ── */}
          <div className="hidden md:block absolute inset-x-0" style={{ top: '32px', pointerEvents: 'none' }}>
            <div className="flex items-center justify-between px-[10%]">
              {[0,1,2,3].map((i) => (
                <div key={i} className="flex-1 flex items-center justify-center">
                  <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 10 H32" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round"/>
                    <path d="M28 4 L38 10 L28 16" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>      
          
              {/* Step cards */}
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((s, i) => (
              <div key={s.num}
                className={`text-center ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 0.12}s` }}>

                {/* Icon bubble */}
                <div className="relative mb-5 flex justify-center">
                  {/* Glow ring behind icon */}
                  <div
                    className="absolute w-20 h-20 rounded-full opacity-20 blur-md"
                    style={{ backgroundColor: s.color, top: '-4px' }}
                  />
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      border: `1.5px solid rgba(255,255,255,0.15)`,
                      color: s.color,
                      boxShadow: `0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}>
                    {s.icon}
                    {/* Number badge */}
                    <div
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg"
                      style={{ backgroundColor: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {s.num}
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-sm mb-2 text-white"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
const Testimonial = () => {
  const [ref, inView] = useInView()
  const testimonials = [
    { name: 'Rani A.',  role: 'Mahasiswi, Bandung', avatar: 'RA', text: 'Sebelumnya ribut terus soal siapa yang udah bayar. Sekarang cukup buka Talang.in, semua jelas!',                     color: P.teal    },
    { name: 'Budi S.',  role: 'Anak kos, Jogja',    avatar: 'BS', text: 'Iuran kos yang biasanya pusing banget ngitungnya, sekarang tinggal input dan langsung ketahuan siapa kurang bayar.', color: P.accent  },
    { name: 'Citra M.', role: 'Traveler, Jakarta',  avatar: 'CM', text: 'Trip Bali bareng 8 orang, dulu pusing banget. Sekarang pakai Talang.in semua beres dan gak ada yang protes!',        color: P.primary },
  ]

  return (
    <section className="py-20" style={{ backgroundColor: P.bg }}>
      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: P.teal, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>KATA MEREKA</p>
          <h2 className={`text-4xl font-extrabold mb-4 ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
            style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Sudah dipercaya<br />banyak grup
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={t.name}
              className={`card-3d bg-white rounded-2xl p-6 border cursor-default relative overflow-hidden ${inView ? 'animate-fadeUp' : 'opacity-0'}`}
              style={{ borderColor: P.border, animationDelay: `${i * 0.12}s` }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.05]" style={{ backgroundColor: t.color }} />
              <div className="text-3xl mb-4" style={{ color: t.color }}>"</div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: P.text }}>{t.text}</p>
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: P.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: t.color }}>{t.avatar}</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: P.textMuted }}>{t.role}</p>
                </div>
                <div className="ml-auto text-xs" style={{ color: P.amber }}>★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Manfaat ──────────────────────────────────────────────────────────────────
const Manfaat = () => {
  const [ref, inView] = useInView()
  const benefits = [
    'Mengurangi salah hitung dan konflik',
    'Transparan untuk semua anggota',
    'Pembayaran lebih adil dan merata',
    'Histori lengkap setiap transaksi',
    'Insight keuangan yang mudah dipahami',
    'Algoritma simplify debt otomatis',
  ]

  return (
    <section id="tentang" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div ref={ref}>
            <p className={`text-xs font-bold tracking-widest mb-3 ${inView ? 'animate-slideRight' : 'opacity-0'}`}
              style={{ color: P.teal, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>KENAPA TALANG.IN?</p>
            <h2 className={`text-3xl font-extrabold mb-4 leading-tight ${inView ? 'animate-slideRight delay-100' : 'opacity-0'}`}
              style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Patungan jadi lebih jelas,<br />adil, dan mudah dipantau.
            </h2>
            <p className={`text-sm leading-relaxed mb-8 ${inView ? 'animate-slideRight delay-200' : 'opacity-0'}`}
              style={{ color: P.textMuted }}>
              Semua anggota bisa melihat kondisi grup tanpa harus menebak-nebak atau menghitung ulang secara manual.
              Dibuat oleh Tim CC26-PSU151 untuk Capstone Coding Camp 2026 DBS Foundation.
            </p>
            <div className={`flex flex-col gap-3 ${inView ? 'animate-fadeUp delay-300' : 'opacity-0'}`}>
              {benefits.map((item) => (
                <div key={item}
                  className="feature-pill flex items-center gap-3 px-4 py-3 rounded-xl border cursor-default"
                  style={{ borderColor: P.border, backgroundColor: `rgba(54,173,163,0.04)` }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 teal-btn">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-sm" style={{ color: P.text }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health score visual */}
          <div className={`${inView ? 'animate-scaleIn delay-200' : 'opacity-0'}`}>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-15"
                style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.teal})` }} />
              <div className="relative bg-white rounded-3xl p-6 border shadow-xl" style={{ borderColor: P.border }}>
                <p className="text-xs font-bold tracking-wider mb-4"
                  style={{ color: P.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>KESEHATAN GRUP KAMU</p>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold" style={{ color: P.text }}>Health Score</span>
                    <span className="text-2xl font-extrabold" style={{ color: P.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>82/100</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: `rgba(18,19,88,0.08)` }}>
                    <div className="h-full rounded-full" style={{ width: '82%', background: `linear-gradient(to right, ${P.primary}, ${P.teal})` }} />
                  </div>
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: P.teal }}>
                    Grup dalam kondisi sehat <Star size={12} fill="currentColor" className="text-amber-400" />
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Andi Pratama', balance: '+Rp250.000', status: 'credit', pct: 75 },
                    { name: 'Budi Santoso', balance: '-Rp180.000', status: 'debit',  pct: 55 },
                    { name: 'Citra Dewi',   balance: '+Rp130.000', status: 'credit', pct: 40 },
                    { name: 'Deni Wahyu',   balance: '-Rp200.000', status: 'debit',  pct: 60 },
                  ].map((m) => (
                    <div key={m.name}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: m.status === 'credit' ? P.teal : '#ef4444' }}>{m.name[0]}</div>
                          <span className="text-xs" style={{ color: P.text }}>{m.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: m.status === 'credit' ? P.teal : '#ef4444' }}>{m.balance}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: `${m.status === 'credit' ? P.teal : '#ef4444'}18` }}>
                        <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.status === 'credit' ? P.teal : '#ef4444' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl p-3 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, rgba(18,19,88,0.06), rgba(54,173,163,0.08))` }}>
                  <Zap size={14} style={{ color: P.amber, flexShrink: 0 }} />
                  <p className="text-xs font-bold" style={{ color: P.primary }}>Cukup 2 transfer untuk lunasin semua hutang!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTA = () => {
  const [ref, inView] = useInView()
  return (
    <section className="py-24 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${P.navy} 0%, ${P.primaryMid} 55%, #1a3a6e 100%)` }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-dots)" />
        </svg>

        <div className="animate-morphBlob absolute w-80 h-80 opacity-20 -top-20 -left-20"
          style={{ background: `radial-gradient(circle, ${P.teal}80, transparent 70%)`, animationDuration: '11s' }} />
        <div className="animate-morphBlob absolute w-64 h-64 opacity-15 -bottom-16 -right-16"
          style={{ background: `radial-gradient(circle, ${P.accent}70, transparent 70%)`, animationDuration: '9s', animationDelay: '-4s' }} />

        <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border opacity-10"
          style={{ borderColor: P.teal }} />
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border opacity-10"
          style={{ borderColor: P.teal }} />
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border opacity-10"
          style={{ borderColor: P.accent }} />

        <div className="animate-float absolute left-12 top-12 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 hidden lg:flex items-center gap-3"
          style={{ animationDuration: '6s' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(54,173,163,0.3)' }}>
            <Receipt size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Split otomatis</p>
            <p className="text-xs text-white/60">dalam hitungan detik</p>
          </div>
        </div>

        <div className="animate-floatB absolute right-12 top-16 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 hidden lg:flex items-center gap-3"
          style={{ animationDuration: '8s' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.3)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Health Score</p>
            <p className="text-xs font-black" style={{ color: P.teal }}>82/100</p>
          </div>
        </div>

        <div className="animate-float absolute left-16 bottom-16 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 hidden lg:flex items-center gap-3"
          style={{ animationDuration: '7s', animationDelay: '-3s' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(47,87,138,0.4)' }}>
            <Users size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">50+ pengguna</p>
            <p className="text-xs text-white/60">sudah bergabung</p>
          </div>
        </div>

        <div className="animate-floatB absolute right-16 bottom-20 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 hidden lg:flex items-center gap-3"
          style={{ animationDuration: '9s', animationDelay: '-5s' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(54,173,163,0.3)' }}>
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Gratis selamanya</p>
            <p className="text-xs text-white/60">tanpa kartu kredit</p>
          </div>
        </div>
      </div>

      <div ref={ref} className="relative max-w-3xl mx-auto px-6 text-center">
        <div className={`mb-6 flex justify-center text-white/90 ${inView ? 'animate-scaleIn delay-100' : 'opacity-0'}`}>
          <ArrowUpDown size={56} strokeWidth={1.5} />
        </div>

        <h2 className={`text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight ${inView ? 'animate-fadeUp delay-200' : 'opacity-0'}`}
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Mulai kelola patungan<br />
          <span style={{ color: P.teal }}>grup dengan lebih rapi</span>
        </h2>

        <p className={`text-base mb-8 max-w-md mx-auto ${inView ? 'animate-fadeUp delay-300' : 'opacity-0'}`}
          style={{ color: 'rgba(255,255,255,0.7)' }}>
          Bergabung dengan ratusan pengguna yang sudah merasakan kemudahan Talang.in. Gratis dan mudah.
        </p>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 ${inView ? 'animate-fadeUp delay-400' : 'opacity-0'}`}>
          <Link to="/register"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base teal-btn shadow-2xl"
            style={{ boxShadow: `0 16px 48px rgba(54,173,163,0.45)` }}>
            Daftar Gratis Sekarang <ArrowRight size={18} />
          </Link>
          <Link to="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold border transition hover:bg-white/10"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
            Sudah punya akun?
          </Link>
        </div>

        <p className={`text-xs ${inView ? 'animate-fadeUp delay-500' : 'opacity-0'}`}
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          Tidak perlu kartu kredit · Gratis selamanya · Setup dalam 2 menit
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="py-12 border-t bg-white" style={{ borderColor: P.border }}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.svg" alt="Talang.in" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Talang.in</span>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: P.textMuted }}>
            Membantu grup mencatat, membagi, dan memahami transaksi patungan dengan mudah dan transparan.
          </p>
          <div className="flex gap-2">
            {[<MessageSquare size={14} />, <Users size={14} />, <TrendingUp size={14} />].map((icon, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer hover:border-teal-300 transition"
                style={{ borderColor: P.border, color: P.textMuted }}>{icon}</div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold mb-4 tracking-wider" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>NAVIGASI</p>
          {[
            { label: 'Beranda',    href: '#beranda'           },
            { label: 'Fitur',      href: '#fitur'             },
            { label: 'Cara Kerja', href: '#cara-kerja'        },
            { label: 'Insight',    href: '#dashboard-insight' },
            { label: 'Tentang',    href: '#tentang'           },
          ].map((m) => (
            <a key={m.label} href={m.href}
              className="block text-xs mb-2.5 hover:opacity-60 transition" style={{ color: P.textMuted }}>{m.label}</a>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold mb-4 tracking-wider" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>PRODUK</p>
          {['Dashboard', 'Split Bill', 'Analytics', 'Simplify Debt'].map((m) => (
            <a key={m} href="#" className="block text-xs mb-2.5 hover:opacity-60 transition" style={{ color: P.textMuted }}>{m}</a>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold mb-4 tracking-wider" style={{ color: P.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>HUBUNGI KAMI</p>
          <p className="text-xs mb-2" style={{ color: P.textMuted }}>CC26-PSU151@student.devacademy.id</p>
          <p className="text-xs" style={{ color: P.textMuted }}>Tim CC26-PSU151</p>
          <div className="mt-4 px-3 py-2 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: `rgba(54,173,163,0.1)`, color: P.teal }}>
            Capstone 2026 DBS <Landmark size={14} />
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 border-t" style={{ borderColor: P.border }}>
        <p className="text-xs" style={{ color: P.textMuted }}>© 2026 Talang.in. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/kebijakan-privasi" className="text-xs hover:opacity-60 transition" style={{ color: P.textMuted }}>Kebijakan Privasi</Link>
          <Link to="/syarat-ketentuan" className="text-xs hover:opacity-60 transition" style={{ color: P.textMuted }}>Syarat & Ketentuan</Link>
        </div>
      </div>
    </div>
  </footer>
)

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div>
      <GlobalStyle />
      <Navbar />
      <Hero />
      <TickerBanner />
      <Stats />
      <Kebutuhan />
      <Fitur />
      <DashboardInsight />
      <CaraKerja />
      <Testimonial />
      <Manfaat />
      <CTA />
      <Footer />
    </div>
  )
}