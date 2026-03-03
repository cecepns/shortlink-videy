import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Link2, Menu, LogOut } from 'lucide-react'

function Dashboard({ token, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const handleUnauthorized = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  const isDashboard = location.pathname.startsWith('/admin/dashboard')
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-slate-900 text-slate-100 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <span className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
              <Link2 className="h-4 w-4" />
            </span>
            Shortlink Admin
          </span>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="mt-4 space-y-1 px-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/shortlinks"
            className={({ isActive }) =>
              `flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Manajemen Shortlink
          </NavLink>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-slate-400 truncate pr-2">Admin</span>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-xs rounded border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1 flex flex-col overflow-x-hidden">
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm lg:hidden">
          <button
            className="text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800">
            {isDashboard ? 'Dashboard' : 'Manajemen Shortlink'}
          </span>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
          <Outlet
            context={{
              token,
              onUnauthorized: handleUnauthorized,
            }}
          />
        </main>
      </div>
    </div>
  )
}

export default Dashboard

