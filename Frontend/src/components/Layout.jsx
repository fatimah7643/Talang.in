import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

const C = { navy: '#232F72', teal: '#36ADA3' }

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 lg:ml-56 min-h-screen">
        {/* Mobile topbar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <Menu size={18} style={{ color: C.navy }} />
          </button>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" width="28" height="28">
              <rect width="36" height="36" rx="9" fill="#232F72"/>
              <path d="M10 10h16v2.8h-6.4v13.2h-3.2V12.8H10V10z" fill="white"/>
            </svg>
            <span className="font-bold text-sm" style={{ color: C.navy }}>Talang.in</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default Layout