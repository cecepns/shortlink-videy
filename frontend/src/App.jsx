import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import DashboardHome from './pages/DashboardHome'
import ShortlinkManagement from './pages/ShortlinkManagement'
import ShortRedirect from './pages/ShortRedirect'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const handleLoginSuccess = (newToken) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute token={token}>
              <Dashboard token={token} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="shortlinks" element={<ShortlinkManagement />} />
        </Route>
        <Route path="/s/:code" element={<ShortRedirect />} />
        <Route
          path="*"
          element={<Navigate to={token ? '/admin' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default App
