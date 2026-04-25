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
    <>
      {/* Safe area spacer for iOS status bar */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      {/* Floating glass header — matches Library */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2" style={{ top: 'env(safe-area-inset-top)' }}>
        <div
          className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#F5E9E0]/12"
          style={{
            background: 'rgba(59, 43, 58, 0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.35)',
          }}
        >
          {showBack ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-[#F5E9E0]/08 hover:bg-[#F5E9E0]/15 flex items-center justify-center text-[#F5E9E0] transition-colors flex-shrink-0 active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8 flex-shrink-0">
              <img src="/logo-orange.png" alt="Kahani" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {title ? (
              <>
                <div className="font-black text-[#F5E9E0] text-base tracking-tight leading-tight truncate">
                  {title}
                </div>
                {subtitle && (
                  <div className="text-xs text-[#D5D9EC]/60 mt-0.5 truncate">
                    {subtitle}
                  </div>
                )}
              </>
            ) : (
              <span
                className="text-[#D95D39] text-xl tracking-tight"
                style={{ fontFamily: "'Shrikhand', cursive" }}
              >
                KAHANI
              </span>
            )}
          </div>

          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
      </div>
    </>
  )
}
