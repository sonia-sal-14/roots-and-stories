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
    <div className="bg-[#3B2B3A] border-b border-[#F5E9E0]/08 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
      {showBack && (
        <button onClick={handleBack} className="text-[#F5E9E0] hover:opacity-60 transition-opacity flex-shrink-0 p-1 -ml-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {!showBack && (
        <div className="w-8 h-8 bg-[#F5E9E0] rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.2)] overflow-hidden">
          <img src="/logo-orange.png" alt="Kahani" className="w-full h-full object-contain p-0.5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {title ? (
          <>
            <div className="font-bold text-[#F5E9E0] leading-tight truncate">{title}</div>
            {subtitle && <div className="text-xs text-[#D5D9EC]/60 truncate">{subtitle}</div>}
          </>
        ) : (
          <span className="font-black text-[#F5E9E0] text-xl tracking-tight">kahani</span>
        )}
      </div>

      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}
