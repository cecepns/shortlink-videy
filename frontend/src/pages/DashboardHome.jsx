import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { Link2, Eye, HelpCircle, TrendingUp, BarChart2 } from 'lucide-react'

function DashboardHome() {
  const { token } = useOutletContext()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, active: 0, totalClicks: 0, clicksToday: 0, liveTraffic: 0 })
  const [trendData, setTrendData] = useState([])
  const [range, setRange] = useState('7d')
  const [chartType, setChartType] = useState('line')
  const [error, setError] = useState('')
  const [loadingTrend, setLoadingTrend] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
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
        setStats({
          total: data.total,
          active: data.active,
          totalClicks: data.totalClicks,
          clicksToday: data.clicksToday,
          liveTraffic: data.liveTraffic,
        })
      } catch (err) {
        setError(err.message)
      }
    }
    loadStats()
  }, [token])

  useEffect(() => {
    const loadTrend = async () => {
      if (!token) return
      try {
        setLoadingTrend(true)
        const res = await fetch(`${API_BASE_URL}/clicks-trend?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengambil tren data')
        }
        setTrendData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingTrend(false)
      }
    }
    loadTrend()
  }, [token, range])

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Live Traffic bar with animations */}
      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>LIVE TRAFFIC</span>
        </div>
        <div className="flex items-center gap-1.5 text-lg font-black text-emerald-400">
          <TrendingUp className="h-4.5 w-4.5" />
          <span>{Number(stats.liveTraffic).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Clicks Today Card - Blue gradient, Image 2 style */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg flex flex-col justify-between h-48 sm:col-span-2 lg:col-span-2">
          {/* Decorative background shape */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          
          <div>
            <p className="text-xs font-semibold tracking-wider text-blue-100 uppercase">
              Clicks Today
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {Number(stats.clicksToday).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="border-t border-blue-400/30 pt-4 flex items-center justify-between mt-auto">
            <span className="text-[10px] font-bold tracking-wider text-blue-200">
              YOUR PERSONAL DASHBOARD
            </span>
            <button
              onClick={() => navigate('/admin/shortlinks')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/25 transition border border-white/10 active:scale-95"
            >
              <span>CREATE LINK</span>
              <span className="font-bold">+</span>
            </button>
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Clicks
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {Number(stats.totalClicks).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Total Shortlinks Card */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Shortlink
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {Number(stats.total).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Active Shortlinks Card */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active Shortlink
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {Number(stats.active).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Info</span>
            </p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Gunakan menu &quot;Manajemen Shortlink&quot; untuk membuat dan mengelola link Anda yang aktif maupun nonaktif.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Section, Image 1 style */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-slate-800">Statistics</h2>
          
          {/* Time range buttons */}
          <div className="flex bg-slate-200/70 rounded-xl p-1 text-xs font-semibold border border-slate-300/40">
            {[
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7d' },
              { key: '30d', label: '30d' },
              { key: 'all', label: 'All' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setRange(item.key)}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  range === item.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Click Trend Chart Card (dark styled as in Image 1) */}
        <ClickChart
          data={trendData}
          range={range}
          chartType={chartType}
          setChartType={setChartType}
          loading={loadingTrend}
        />
      </div>
    </div>
  )
}

function ClickChart({ data, range, chartType, setChartType, loading }) {
  const maxClicks = Math.max(...data.map(d => d.clicks)) || 10
  
  let roundedMax = 10
  if (maxClicks > 10) roundedMax = Math.ceil(maxClicks / 5) * 5
  if (maxClicks > 100) roundedMax = Math.ceil(maxClicks / 50) * 50
  if (maxClicks > 1000) roundedMax = Math.ceil(maxClicks / 500) * 500
  if (maxClicks > 10000) roundedMax = Math.ceil(maxClicks / 5000) * 5000
  if (maxClicks > 100000) roundedMax = Math.ceil(maxClicks / 50000) * 50000

  const width = 600
  const height = 300
  const paddingLeft = 60
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 60

  const graphWidth = width - paddingLeft - paddingRight
  const graphHeight = height - paddingTop - paddingBottom

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * graphWidth
    const y = paddingTop + graphHeight - (d.clicks / roundedMax) * graphHeight
    return { x, y, clicks: d.clicks, label: d.label }
  })

  const yTicks = []
  for (let i = 0; i <= 4; i++) {
    const val = (roundedMax / 4) * i
    const y = paddingTop + graphHeight - (i / 4) * graphHeight
    yTicks.push({ val, y })
  }

  let pathD = ''
  let areaD = ''
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`
    areaD = `M ${points[0].x} ${paddingTop + graphHeight} L ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpX1 = p0.x + (p1.x - p0.x) / 3
      const cpY1 = p0.y
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3
      const cpY2 = p1.y
      
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
      areaD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
    }
    areaD += ` L ${points[points.length - 1].x} ${paddingTop + graphHeight} Z`
  }

  const barWidth = data.length > 0 ? (graphWidth / data.length) * 0.6 : 0
  const barSpacing = data.length > 0 ? (graphWidth / data.length) * 0.4 : 0

  const rangeLabels = {
    today: 'Today',
    '7d': '7d',
    '30d': '30d',
    all: 'All Time'
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-900 p-6 text-white shadow-xl space-y-4">
      {loading && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-xs text-slate-400">Memuat data tren...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-semibold text-sm sm:text-base tracking-wide">
            Click Trend ({rangeLabels[range] || range})
          </span>
        </div>
        
        <div className="flex bg-slate-800/80 rounded-lg p-0.5 text-xs font-semibold border border-slate-700/30">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 rounded-md transition ${chartType === 'line' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-md transition ${chartType === 'bar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="min-w-[500px]">
          {data.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-slate-500 space-y-2">
              <BarChart2 className="h-10 w-10 text-slate-600" />
              <p className="text-xs">Belum ada data klik untuk periode ini.</p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {yTicks.map((tick, i) => (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={tick.y}
                    x2={width - paddingRight}
                    y2={tick.y}
                    stroke="#334155"
                    strokeWidth="0.8"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={tick.y + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    textAnchor="end"
                    className="font-mono"
                  >
                    {tick.val.toLocaleString('id-ID')}
                  </text>
                </g>
              ))}

              <line
                x1={paddingLeft}
                y1={paddingTop + graphHeight}
                x2={width - paddingRight}
                y2={paddingTop + graphHeight}
                stroke="#334155"
                strokeWidth="1.5"
                className="opacity-70"
              />

              {chartType === 'line' ? (
                <>
                  {points.length > 0 && (
                    <path d={areaD} fill="url(#chartGradient)" />
                  )}
                  
                  {points.length > 0 && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  )}

                  {points.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4.5"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="12"
                        fill="transparent"
                      />
                      <title>{`${p.label}: ${p.clicks.toLocaleString('id-ID')} Clicks`}</title>
                    </g>
                  ))}
                </>
              ) : (
                <>
                  {points.map((p, i) => {
                    const x = paddingLeft + i * (graphWidth / data.length) + barSpacing / 2
                    const y = p.y
                    const w = barWidth
                    const h = paddingTop + graphHeight - p.y
                    return (
                      <g key={i} className="group cursor-pointer">
                        <rect
                          x={x}
                          y={y}
                          width={w}
                          height={Math.max(1.5, h)}
                          fill="#3b82f6"
                          rx="2.5"
                          ry="2.5"
                          className="transition-all duration-200 hover:fill-blue-400"
                        />
                        <title>{`${p.label}: ${p.clicks.toLocaleString('id-ID')} Clicks`}</title>
                      </g>
                    )
                  })}
                </>
              )}

              {points.map((p, i) => {
                const showLabel =
                  data.length <= 10 ||
                  (data.length === 30 && i % 3 === 0) ||
                  (data.length > 30 && i % Math.ceil(data.length / 8) === 0) ||
                  i === data.length - 1

                if (!showLabel) return null

                let labelX = p.x
                if (chartType === 'bar' && data.length > 0) {
                  labelX = paddingLeft + i * (graphWidth / data.length) + (graphWidth / data.length) / 2
                }

                return (
                  <g key={i} className="opacity-60">
                    <text
                      x={labelX}
                      y={paddingTop + graphHeight + 15}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                      className="font-medium"
                      transform={`rotate(-28, ${labelX}, ${paddingTop + graphHeight + 15})`}
                    >
                      {p.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardHome

