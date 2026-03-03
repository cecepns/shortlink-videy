import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE_URL } from '../config'

function ShortRedirect() {
  const { code } = useParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        setError('')
        const res = await fetch(`${API_BASE_URL}/links/${code}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || 'Shortlink tidak ditemukan')
        }
        window.location.href = data.original_url
      } catch (err) {
        setError(err.message)
      }
    }
    if (code) {
      run()
    }
  }, [code])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 text-center space-y-3">
        <h1 className="text-xl font-semibold text-slate-800">Mengalihkan...</h1>
        {!error && (
          <p className="text-sm text-slate-600">
            Mohon tunggu, Anda sedang diarahkan ke tujuan shortlink.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">Terjadi kesalahan: {error}</p>
        )}
      </div>
    </div>
  )
}

export default ShortRedirect

