import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import Welcome from '@/pages/Welcome'
import SignUp from '@/pages/SignUp'
import SignIn from '@/pages/SignIn'
import ProfileSetup from '@/pages/ProfileSetup'
import FamilySetup from '@/pages/FamilySetup'
import Library from '@/pages/Library'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Semi-protected: require auth but no family yet */}
          <Route path="/profile-setup" element={
            <ProtectedRoute><ProfileSetup /></ProtectedRoute>
          } />
          <Route path="/family-setup" element={
            <ProtectedRoute><FamilySetup /></ProtectedRoute>
          } />

          {/* Fully protected routes */}
          <Route path="/library" element={
            <ProtectedRoute><Library /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
