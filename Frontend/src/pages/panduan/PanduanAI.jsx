import { useState } from "react";
import {
  Sparkles, Users, Banknote, Receipt, UserCheck, Divide,
  FileText, User, CheckSquare, XSquare, Lightbulb, Bot,
  Copy, Check, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const formats = [
  {
    id: 1,
    icon: Users,
    label: "Split dengan nominal per orang",
    tag: "Paling umum",
    tagColor: "#0F6E56",
    tagBg: "#E1F5EE",
    desc: "Kamu tahu berapa yang harus dibayar masing-masing orang.",
    rules: [
      'Tulis kata "total" diikuti jumlahnya',
      "Sebutkan siapa yang bayar duluan",
      "Tulis nama dan nominal tiap orang",
    ],
    example: `makan siang bakso dan es teh total 175000 dibayar Maria, fatimah 30000, maria 25000, risna 40000, michael 50000, elisabeth 30000`,
    notes: [],
  },
  {
    id: 2,
    icon: Banknote,
    label: "Nominal besar (format juta/rb)",
    tag: "Format singkat",
    tagColor: "#185FA5",
    tagBg: "#E6F1FB",
    desc: "Bisa pakai singkatan rb, ribu, jt, juta — AI akan membacanya dengan benar.",
    rules: [
      'Tulis kata "total" diikuti jumlahnya',
      "Boleh pakai format 1,5jt / 300rb / 1.5 juta",
      "Tulis nama dan nominal tiap orang",
    ],
    example: `nongkrong total 1,5jt dibayar michael, michael 300rb, fatimah 250rb, maria 300rb, risna 350rb, elisabeth 300rb`,
    notes: [],
  },
  {
    id: 3,
    icon: Receipt,
    label: "Itemized (struk / nota)",
    tag: "Ada diskon & tax",
    tagColor: "#854F0B",
    tagBg: "#FAEEDA",
    desc: "Cocok kalau kamu punya rincian item, diskon, atau pajak. AI akan menghitung otomatis.",
    rules: [
      "Sebutkan siapa yang bayar dan totalnya",
      "Tulis item beserta harga dan siapa yang pesan",
      "Kalau ada diskon atau tax, sebutkan nominalnya",
    ],
    example: `Risna bayar semuanya dengan total 225ribu:\n• Paket seafood 120k buat Fatimah Maria Risna\n• Michael pesen steak 55k\n• Elisabeth pesen spaghetti 35k\n• Air mineral 5k x5\nDiskon member 25k\nTax 15k`,
    notes: [],
  },
  {
    id: 4,
    icon: UserCheck,
    label: "Tidak semua anggota ikut",
    tag: "Pakai uncheck",
    tagColor: "#A32D2D",
    tagBg: "#FCEBEB",
    desc: "Kalau ada anggota grup yang tidak ikut, uncheck nama mereka di dropdown Participants sebelum proses.",
    rules: [
      'Tulis kata "total" dan siapa yang bayar',
      "Sebutkan siapa saja yang ikut dalam teks",
      "Uncheck nama yang tidak ikut di dropdown",
    ],
    example: `beli cemilan kantor total 135 ribu dibayar Michael. Yang makan cuma Michael, Maria, dan Fatimah`,
    notes: ["Risna dan Elisabeth diuncheck dari dropdown Participants"],
  },
  {
    id: 5,
    icon: Divide,
    label: "Split rata tanpa rincian",
    tag: "Bagi sama rata",
    tagColor: "#533AB7",
    tagBg: "#EEEDFE",
    desc: "Kalau semua bayar sama banyak, cukup sebut total dan siapa yang bayar duluan. AI akan bagi rata.",
    rules: [
      'Tulis kata "total" dan jumlahnya',
      "Sebutkan siapa yang bayar duluan",
      "Pilih siapa saja yang ikut di dropdown",
    ],
    example: `Michael bayarin makan malam total 420k buat berlima`,
    notes: ["Pilih 5 nama yang ikut dari dropdown Participants"],
  },
];

const globalRules = [
  { icon: FileText,    text: 'Selalu tulis kata "total" diikuti jumlahnya' },
  { icon: User,        text: "Sebutkan siapa yang bayar duluan" },
  { icon: CheckSquare, text: "Pilih participant yang ikut di dropdown" },
  { icon: XSquare,     text: "Uncheck nama yang tidak ikut transaksi" },
];

export default function PanduanAI() {
  const [activeId, setActiveId] = useState(null);
  const [copied, setCopied] = useState(null);
  const navigate = useNavigate();

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8F9FB", minHeight: "100vh", paddingBottom: 60 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EAECF0", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* Tombol back */}
            <button
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 16 }}
            >
            <ChevronDown size={16} color="#6B7280" style={{ transform: "rotate(90deg)" }} />
            Kembali
            </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1D9E75,#0F6E56)", display: "flex", alignItems: "center", justifyContent: "center" }}>


              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F6E56", letterSpacing: ".04em", textTransform: "uppercase" }}>AI Smart Input</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111827", margin: "0 0 8px", lineHeight: 1.3 }}>Panduan Format Input</h1>
          <p style={{ fontSize: 15, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
            AI bisa baca teks bebas — tapi ada beberapa aturan sederhana biar hasilnya akurat.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px" }}>

        {/* Global Rules */}
        <div style={{ background: "#fff", border: "1px solid #EAECF0", borderRadius: 14, padding: "20px 24px", margin: "28px 0 8px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 14px" }}>Wajib diperhatikan di semua format</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {globalRules.map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#F9FAFB", borderRadius: 10, padding: "10px 14px" }}>
                <Icon size={16} color="#1D9E75" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Format Cards */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: ".06em", textTransform: "uppercase", margin: "28px 0 12px" }}>Format yang didukung</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {formats.map((f) => {
            const isOpen = activeId === f.id;
            const Icon = f.icon;
            return (
              <div key={f.id} style={{ background: "#fff", border: `1px solid ${isOpen ? "#1D9E75" : "#EAECF0"}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s" }}>
                <button
                  onClick={() => setActiveId(isOpen ? null : f.id)}
                  style={{ width: "100%", background: "none", border: "none", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: f.tagBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={f.tagColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{f.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: f.tagColor, background: f.tagBg, padding: "2px 8px", borderRadius: 99 }}>{f.tag}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{f.desc}</span>
                  </div>
                  <ChevronDown size={18} color="#9CA3AF" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s", flexShrink: 0 }} />
                </button>

                {isOpen && (
                  <div style={{ borderTop: "1px solid #F3F4F6", padding: "18px 20px 20px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: ".05em", textTransform: "uppercase", margin: "0 0 10px" }}>Cara penulisan</p>
                    <ol style={{ margin: "0 0 18px", padding: "0 0 0 18px" }}>
                      {f.rules.map((r, i) => (
                        <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 4 }}>{r}</li>
                      ))}
                    </ol>

                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: ".05em", textTransform: "uppercase", margin: "0 0 8px" }}>Contoh input</p>
                    <div style={{ position: "relative", background: "#F8F9FB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                      <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#1D9E75", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                        {f.example.replace(/\\n/g, "\n")}
                      </pre>
                      <button
                        onClick={() => handleCopy(f.example.replace(/\\n/g, "\n"), f.id)}
                        style={{ position: "absolute", top: 10, right: 10, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 7, padding: "4px 10px", fontSize: 12, color: "#6B7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {copied === f.id
                          ? <><Check size={13} color="#1D9E75" /> <span style={{ color: "#1D9E75" }}>Disalin</span></>
                          : <><Copy size={13} /> Salin</>
                        }
                      </button>
                    </div>

                    {f.notes.length > 0 && (
                      <div style={{ marginTop: 12, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <Lightbulb size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          {f.notes.map((n, i) => (
                            <p key={i} style={{ fontSize: 13, color: "#92400E", margin: 0, lineHeight: 1.5 }}>{n}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div style={{ marginTop: 24, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Bot size={20} color="#4338CA" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#3730A3", margin: "0 0 4px" }}>AI tidak selalu sempurna</p>
            <p style={{ fontSize: 13, color: "#4338CA", margin: 0, lineHeight: 1.6 }}>
              Kalau hasil parsing terasa tidak sesuai, coba tambahkan lebih banyak detail atau gunakan format yang lebih terstruktur. Semakin jelas teks yang kamu tulis, semakin akurat hasilnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}