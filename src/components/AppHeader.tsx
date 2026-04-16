import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface AppHeaderProps {
  showBack?: boolean
  backTo?: string
  onBack?: () => void
  title?: string
  subtitle?: string
  right?: React.ReactNode
}

export function AppHeader({ showBack = false, backTo, onBack, title, subtitle, right }: AppHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) { onBack(); return }
    if (backTo) { navigate(backTo); return }
    navigate(-1)
  }

  return (
    <div className="bg-white border-b border-[#5C3D2E]/8 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
      {showBack && (
        <button onClick={handleBack} className="text-[#5C3D2E] hover:opacity-60 transition-opacity flex-shrink-0 p-1 -ml-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {!showBack && (
        <div className="w-8 h-8 bg-[#5C3D2E] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-base">🌳</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {title ? (
          <>
            <div className="font-bold text-[#5C3D2E] leading-tight truncate">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
          </>
        ) : (
          <span className="font-black text-[#5C3D2E] text-xl tracking-tight">kahani</span>
        )}
      </div>

      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}
