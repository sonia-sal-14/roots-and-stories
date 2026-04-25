import { Sparkles, X } from 'lucide-react'

interface TutorialBannerProps {
  step: number
  totalSteps?: number
  body: string
  onSkip: () => void
}

/**
 * Fixed-bottom tutorial banner styled like the Library glass header
 * but with an orange glow so it's obvious where to look. The tutorial
 * advances when the user takes the on-screen action — there is no
 * "Next" button, only "Skip".
 */
export function TutorialBanner({
  step,
  totalSteps = 4,
  body,
  onSkip,
}: TutorialBannerProps) {
  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div
        className="max-w-2xl mx-auto pointer-events-auto rounded-2xl border border-[#D95D39]/40 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(59, 43, 58, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow:
            '0 0 0 1px rgba(217,93,57,0.25), 0 0 32px rgba(217,93,57,0.45), 0 8px 32px rgba(0,0,0,0.45)',
        }}
      >
        {/* Sparkle icon */}
        <div className="w-9 h-9 rounded-xl bg-[#D95D39]/15 border border-[#D95D39]/30 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[#D95D39]" />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-[#D95D39] uppercase tracking-widest mb-0.5">
            Step {step} of {totalSteps}
          </div>
          <div className="text-[#F5E9E0] text-sm font-semibold leading-snug">
            {body}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="p-2 rounded-lg text-[#D5D9EC]/50 hover:text-[#F5E9E0] hover:bg-[#F5E9E0]/05 transition-colors flex-shrink-0"
          title="Skip tutorial"
          aria-label="Skip tutorial"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
