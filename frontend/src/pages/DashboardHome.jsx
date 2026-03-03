import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { Link2, Link2Off } from 'lucide-react'

function DashboardHome() {
  const { token } = useOutletContext()
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setError('')
        const res = await fetch(`${API_BASE_URL}/links-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengambil statistik')
        }
        setStats({ total: data.total, active: data.active })
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [token])

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total Shortlink
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">
              {stats.total}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Active Shortlink
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">
              {stats.active}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Info
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Gunakan menu &quot;Manajemen Shortlink&quot; untuk membuat dan
            mengelola link yang aktif maupun nonaktif.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome

