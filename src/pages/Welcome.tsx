import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      {/* Safe area top padding for iOS notch/status bar */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">

          {/* Logo — large hero */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-44 h-44 mb-6 drop-shadow-[0_12px_32px_rgba(217,93,57,0.55)]">
              <img src="/logo-orange.png" alt="Kahani" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-6xl font-black text-[#D95D39] tracking-tight">kahani</h1>
            <p className="text-[#D5D9EC] font-semibold text-base mt-2 tracking-wide">
              कहानी · historia · 物語
            </p>
          </div>

          {/* Tagline card — glowing border */}
          <div className="rounded-3xl p-6 mb-8 border border-[#D95D39]/40 shadow-[0_0_32px_rgba(217,93,57,0.15)] bg-[#F5E9E0]/06">
            <p className="text-[#F5E9E0] text-xl font-bold leading-snug">
              Preserve your family's stories and share across every generation.
            </p>
            <p className="text-[#D95D39] font-semibold text-sm mt-3">
              For your whole family, forever.
            </p>

            {/* Pills inside the card */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['🎙 Record', '🌍 Translate', '📖 Preserve', '👨‍👩‍👧 Share'].map(f => (
                <span key={f} className="bg-[#F5E9E0]/12 text-[#F5E9E0] text-xs font-semibold px-3 py-1.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button size="lg" className="w-full text-xl py-7 rounded-2xl font-bold" onClick={() => navigate('/signup')}>
              Get started
            </Button>
            <Button size="lg" variant="outline" className="w-full text-xl py-7 rounded-2xl font-bold border-[#F5E9E0]/25 text-[#F5E9E0] hover:bg-[#F5E9E0]/08" onClick={() => navigate('/signin')}>
              Sign in
            </Button>
          </div>

          <p className="text-center text-xs text-[#D5D9EC]/50 mt-6">
            🔒 Private & secure. Only your family can access your stories.
          </p>
        </div>
      </div>

      {/* Safe area bottom padding */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </div>
  )
}
