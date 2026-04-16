import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#5C3D2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5C3D2E] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/welcome" replace />
  }

  return <>{children}</>
}
