import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Lock, Eye, EyeOff, Save,
  // eslint-disable-next-line no-unused-vars
  LogOut, Trash2, CheckCircle, XCircle,
  // eslint-disable-next-line no-unused-vars
  ChevronRight, Bell, Monitor, Shield,
  Upload, Phone, AtSign,
} from 'lucide-react'
import api from '../../services/api'
import { fmtMonthYear } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const C = {
  navyDark: '#121358',
  navy:     '#232F72',
  blue:     '#2F578A',
  teal:     '#36ADA3',
  bg:       '#f4f6fb',
}


/* ── Input ── */
function Input({ label, id, type = 'text', value, onChange, disabled, rightEl, error, placeholder, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="text-xs font-medium text-gray-500">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
            <Icon size={14} />
          </div>
        )}
        <input
          id={id} type={type} value={value}
          onChange={onChange} disabled={disabled}
          placeholder={placeholder}
          className={`w-full h-10 rounded-xl border text-sm bg-white text-gray-800
            placeholder-gray-300 focus:outline-none focus:ring-2 transition
            disabled:opacity-40 disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : 'px-3'} ${rightEl ? 'pr-10' : 'pr-3'}
            ${error
              ? 'border-red-300 focus:ring-red-100'
              : 'border-gray-200 focus:border-gray-300 focus:ring-blue-50'}`}
        />
        {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

/* ── Toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0
        ${checked ? 'bg-[#232F72]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

/* ── Security Item ── */
function SecurityItem({ icon: Icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border
        text-sm font-medium transition hover:opacity-80
        ${danger
          ? 'border-red-100 bg-red-50 text-red-500'
          : 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50'}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={15} className={danger ? 'text-red-400' : 'text-gray-400'} />
        {label}
      </div>
      <ChevronRight size={15} className="text-gray-300" />
    </button>
  )
}

export default function Profil() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  // timerRef removed (was unused)

  const [editForm, setEditForm]     = useState({ name: '', email: '', username: '', phone: '' })
  const [editErrors, setEditErrors] = useState({})
  const [isEditing, setIsEditing]   = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwForm, setPwForm]     = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [showPw, setShowPw]     = useState({ current: false, new: false, confirm: false })

  const [deleteConfirm, setDeleteConfirm]   = useState('')
  const [showDeleteForm, setShowDeleteForm] = useState(false)

  const [notif, setNotif] = useState({
    transaksi_baru:        true,
    pengingat_utang:       true,
    konfirmasi_pembayaran: true,
    insight_mingguan:      false,
  })

const showToast = (message, type = 'success') => {
  if (type === 'success') toast.success(message)
  else toast.error(message)
}

const handleAvatarSelect = (e) => {
  const file = e.target.files[0]

  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    showToast('Ukuran file maksimal 5MB', 'error')
    return
  }

  setAvatarFile(file)
  setAvatarPreview(URL.createObjectURL(file))
}

const handleUploadAvatar = async () => {
  if (!avatarFile) return

  try {
    setUploadingAvatar(true)

    const formData = new FormData()
    formData.append('avatar', avatarFile)

    const response = await api.post(
      `/profiles/${user.id}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    setProfile(prev => ({
      ...prev,
      avatar_url: response.data.avatar_url
    }))

    setAvatarFile(null)
    setAvatarPreview(null)

    showToast('Foto profil berhasil diupload!')
  } catch (error) {
    console.error(error)

    showToast(
      error.response?.data?.message || 'Gagal upload foto',
      'error'
    )
  } finally {
    setUploadingAvatar(false)
  }
}

  useEffect(() => {
    const go = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/profiles/${user?.id}`)
        const d = res.data?.data ?? res.data
        setProfile(d)
        setEditForm({
          name:     d.full_name ?? d.name ?? '',
          email:    d.email ?? '',
          username: d.username ?? '',
          phone:    d.phone ?? '',
        })
      } catch {
        if (user) {
          setProfile(user)
          setEditForm({
            name:     user.full_name ?? user.name ?? '',
            email:    user.email ?? '',
            username: user.username ?? '',
            phone:    user.phone ?? '',
          })
        }
      } finally {
        setLoading(false)
      }
    }
    go()
  }, [user])

  const handleSaveProfile = async () => {
    const errs = {}
    if (!editForm.name.trim())     errs.name     = 'Nama tidak boleh kosong'
    if (!editForm.username.trim()) errs.username = 'Username tidak boleh kosong'
    if (Object.keys(errs).length) { setEditErrors(errs); return }

    try {
      setSavingProfile(true)
      const res = await api.put(`/profiles/${user.id}`, {
        full_name: editForm.name.trim(),
        username:  editForm.username.trim(),
      })
      const updated = res.data?.data ?? res.data
      setProfile(prev => ({ ...prev, ...updated }))
      setEditErrors({})
      setIsEditing(false)
      showToast('Profil berhasil diperbarui!')
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan profil', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditErrors({})
    setEditForm({
      name:     profile?.full_name ?? profile?.name ?? '',
      email:    profile?.email ?? '',
      username: profile?.username ?? '',
      phone:    profile?.phone ?? '',
    })
  }

  const handleChangePassword = async () => {
    const errs = {}
    if (!pwForm.current_password) errs.current_password = 'Masukkan password saat ini'
    if (!pwForm.new_password) errs.new_password = 'Masukkan password baru'
    else if (pwForm.new_password.length < 8) errs.new_password = 'Minimal 8 karakter'
    if (pwForm.new_password !== pwForm.confirm_password) errs.confirm_password = 'Password tidak cocok'
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    try {
      await api.put('/profiles/me/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setPwErrors({})
      showToast('Password berhasil diubah! Silakan login ulang.')
      setTimeout(() => { logout(); navigate('/login') }, 2000)
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal mengubah password', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== (profile?.email ?? '')) return
    try {
      await api.delete('/profiles/me')
      logout(); navigate('/')
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menghapus akun', 'error')
    }
  }

  const initial = (profile?.full_name ?? profile?.name ?? 'U')[0].toUpperCase()
  const avatarUrl = avatarPreview || profile?.avatar_url
  const userId  = profile?.id ? `ID: TLG-${String(profile.id).padStart(4, '0')}` : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Topbar ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${C.teal}18` }}>
            <User size={18} style={{ color: C.teal }} />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: C.navyDark }}>Profil & Pengaturan</h1>
            <p className="text-xs text-gray-400">Atur informasi akun dan preferensi aplikasi.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Cari pengaturan...</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* ── Avatar card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse shrink-0" />
            ) : (
              <div
                className="relative shrink-0 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: C.navy }}
                  >
                    {initial}
                  </div>
                )}

                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Upload size={16} className="text-white" />
                </div>

                <div
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ backgroundColor: C.teal }}
                >
                  <User size={10} color="white" />
                </div>
              </div>
            )}
            <div className="min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="font-bold text-lg" style={{ color: C.navyDark }}>
                    {profile?.full_name ?? profile?.name ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500">{profile?.email ?? '-'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: C.navy }}>Premium User</span>
                    {userId && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500">
                        {userId}
                      </span>
                    )}
                    {profile?.created_at && (
                      <span className="text-xs text-gray-400">
                        Bergabung {fmtMonthYear(profile.created_at)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#232F72' }}
              >
                <Save size={14} /> {savingProfile ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
              >
                Batalkan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#232F72] bg-[#232F72]/5
                text-sm font-semibold text-[#232F72] hover:bg-[#232F72]/10 transition shrink-0"
            >
              <User size={14} /> Edit Profil
            </button>
          )}
        </div>

        {/* ── 2 col layout ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* LEFT: Informasi Akun */}
          <div className="col-span-2 space-y-5">

            {/* Informasi Akun */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="text-base font-bold" style={{ color: C.navyDark }}>Informasi Akun</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nama Lengkap" id="name" icon={User}
                  value={editForm.name} placeholder="Nama lengkap kamu"
                  disabled={!isEditing}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  error={editErrors.name} />
                <Input label="Username" id="username" icon={AtSign}
                  value={editForm.username} placeholder="username kamu"
                  disabled={!isEditing}
                  onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} />
                <Input label="Email" id="email" type="email" icon={Mail}
                  value={editForm.email} placeholder="email@contoh.com"
                  disabled
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  error={editErrors.email} />
                <Input label="Nomor Telepon" id="phone" icon={Phone}
                  value={editForm.phone} placeholder="08xxxxxxxxxx"
                  disabled={!isEditing}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>

              {/* Upload foto — hanya tampil saat mode edit */}
              {isEditing && (<div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Foto Profil
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  {avatarPreview ? (
                    <>
                      <img
                        src={avatarPreview}
                        alt="preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />

                      <p className="text-sm text-[#36ADA3] font-medium">
                        Foto dipilih — klik upload untuk simpan
                      </p>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${C.teal}12` }}
                      >
                        <Upload size={18} style={{ color: C.teal }} />
                      </div>

                      <p className="text-sm text-gray-500 font-medium">
                        Klik atau seret file untuk upload
                      </p>

                      <p className="text-xs text-gray-400">
                        PNG, JPG up to 5MB
                      </p>
                    </>
                  )}
                </div>

                {avatarFile && (
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploadingAvatar}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
                    style={{ backgroundColor: C.teal }}
                  >
                    <Upload size={14} />

                    {uploadingAvatar ? 'Mengupload...' : 'Upload Foto'}
                  </button>
                )}
              </div>)}


            </div>

            {/* Ubah Password */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="text-base font-bold" style={{ color: C.navyDark }}>Ubah Password</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'current_password', label: 'Password Saat Ini',       pwKey: 'current', placeholder: 'Password saat ini' },
                  { key: 'new_password',     label: 'Password Baru',            pwKey: 'new',     placeholder: 'Minimal 8 karakter' },
                  { key: 'confirm_password', label: 'Konfirmasi Password Baru', pwKey: 'confirm', placeholder: 'Ulangi password baru' },
                ].map(({ key, label, pwKey, placeholder }) => (
                  <Input key={key} label={label} id={key} icon={Lock}
                    type={showPw[pwKey] ? 'text' : 'password'}
                    value={pwForm[key]} placeholder={placeholder}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    error={pwErrors[key]}
                    rightEl={
                      <button type="button"
                        onClick={() => setShowPw(p => ({ ...p, [pwKey]: !p[pwKey] }))}
                        className="text-gray-400 hover:text-gray-600 transition">
                        {showPw[pwKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />
                ))}
              </div>
              <button onClick={handleChangePassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: C.navy }}>
                <Lock size={14} /> Ubah Password
              </button>
            </div>

          </div>

          {/* RIGHT: Notifikasi + Keamanan */}
          <div className="space-y-5">

            {/* Notifikasi */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="text-base font-bold" style={{ color: C.navyDark }}>Notifikasi</h2>
              <div className="space-y-3">
                {[
                  { key: 'transaksi_baru',        label: 'Transaksi baru',        desc: 'Update instan setiap ada tagihan' },
                  { key: 'pengingat_utang',        label: 'Pengingat utang',       desc: 'Kirim otomatis ke teman yang belum bayar' },
                  { key: 'konfirmasi_pembayaran',  label: 'Konfirmasi pembayaran', desc: 'Beritahu saya jika pembayaran diterima' },
                  { key: 'insight_mingguan',       label: 'Insight mingguan',      desc: 'Rekap pengeluaran setiap hari Senin' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.navyDark }}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle checked={notif[key]} onChange={v => setNotif(p => ({ ...p, [key]: v }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Keamanan & Akun */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-base font-bold" style={{ color: C.navyDark }}>Keamanan & Akun</h2>
              <div className="space-y-2">
                <SecurityItem icon={Lock}    label="Ubah Password"            onClick={handleChangePassword} />
                <SecurityItem icon={Monitor} label="Keluar dari semua perangkat" onClick={() => showToast('Fitur belum tersedia', 'error')} />
                <SecurityItem icon={Shield}  label="Hapus Akun"               danger onClick={() => setShowDeleteForm(true)} />
              </div>

              {showDeleteForm && (
                <div className="mt-3 space-y-3 border-t border-red-100 pt-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ketik email kamu <span className="font-semibold text-gray-700">({profile?.email})</span> untuk konfirmasi penghapusan permanen.
                  </p>
                  <Input id="delete-confirm"
                    placeholder={profile?.email ?? 'email@contoh.com'}
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== (profile?.email ?? '')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-30"
                      style={{ backgroundColor: '#ef4444' }}>
                      <Trash2 size={13} /> Hapus
                    </button>
                    <button onClick={() => { setShowDeleteForm(false); setDeleteConfirm('') }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition">
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 bg-red-50 text-sm font-semibold text-red-500 hover:bg-red-100 transition">
              <LogOut size={15} /> Keluar dari Akun
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}