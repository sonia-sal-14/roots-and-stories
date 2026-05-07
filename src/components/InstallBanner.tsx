import { Share, X, Download } from 'lucide-react'
import type { InstallPlatform } from '@/hooks/useInstallPrompt'

interface InstallBannerProps {
  platform: InstallPlatform
  onInstall: () => void
  onDismiss: () => void
}

export function InstallBanner({ platform, onInstall, onDismiss }: InstallBannerProps) {
  if (!platform) return null

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div
        className="max-w-2xl mx-auto pointer-events-auto rounded-2xl border border-[#D95D39]/40 px-4 py-3 flex items-start gap-3"
        style={{
          background: 'rgba(59, 43, 58, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow:
            '0 0 0 1px rgba(217,93,57,0.25), 0 0 32px rgba(217,93,57,0.35), 0 8px 32px rgba(0,0,0,0.45)',
        }}
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-[#D95D39]/15 border border-[#D95D39]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          {platform === 'android'
            ? <Download className="w-4 h-4 text-[#D95D39]" />
            : <Share className="w-4 h-4 text-[#D95D39]" />}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="text-[#F5E9E0] text-sm font-semibold leading-snug">
            Add Kahani to your home screen
          </div>

          {platform === 'ios-safari' && (
            <div className="text-[#D5D9EC]/60 text-xs mt-0.5 leading-snug flex items-center gap-1 flex-wrap">
              Tap <Share className="w-3 h-3 inline-block flex-shrink-0" /> then <strong className="text-[#D5D9EC]/80">Add to Home Screen</strong>
            </div>
          )}

          {platform === 'ios-chrome' && (
            <div className="text-[#D5D9EC]/60 text-xs mt-0.5 leading-snug flex items-center gap-1 flex-wrap">
              Tap <Share className="w-3 h-3 inline-block flex-shrink-0" /> then <strong className="text-[#D5D9EC]/80">View more</strong> → <strong className="text-[#D5D9EC]/80">Add to Home Screen</strong>
            </div>
          )}

          {platform === 'android' && (
            <button
              onClick={onInstall}
              className="text-[#D95D39] text-xs font-bold mt-0.5 hover:text-[#F5E9E0] transition-colors"
            >
              Install now
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="p-2 rounded-lg text-[#D5D9EC]/50 hover:text-[#F5E9E0] hover:bg-[#F5E9E0]/05 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
