import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LandingPage } from './public/LandingPage'
import { LoginPage } from './public/LoginPage'
import Workspace from './Workspace'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/acceso" element={<LoginPage />} />
          <Route path="/app" element={<Navigate to="/app/inicio" replace />} />
          <Route path="/app/:view" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
