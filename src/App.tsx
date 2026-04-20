import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import Welcome from '@/pages/Welcome'
import SignUp from '@/pages/SignUp'
import SignIn from '@/pages/SignIn'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import ProfileSetup from '@/pages/ProfileSetup'
import FamilySetup from '@/pages/FamilySetup'
import Library from '@/pages/Library'
import RecordStory from '@/pages/RecordStory'
import ChapterConfirmation from '@/pages/ChapterConfirmation'
import StoryDetail from '@/pages/StoryDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route path="/record" element={
            <ProtectedRoute><RecordStory /></ProtectedRoute>
          } />
          <Route path="/confirm-chapter" element={
            <ProtectedRoute><ChapterConfirmation /></ProtectedRoute>
          } />
          <Route path="/story/:id" element={
            <ProtectedRoute><StoryDetail /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
