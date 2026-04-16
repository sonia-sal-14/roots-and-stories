import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo mark */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D95D39] to-[#E8845E] rounded-3xl flex items-center justify-center shadow-[0_8px_24px_rgba(217,93,57,0.45)] mb-5 rotate-3">
              <span className="text-4xl">🌳</span>
            </div>
            <h1 className="text-5xl font-black text-[#F5E9E0] tracking-tight">kahani</h1>
            <p className="text-[#D95D39] font-semibold text-base mt-1 tracking-wide">
              कहानी · historia · 物語
            </p>
          </div>

          {/* Tagline card */}
          <div className="bg-[#F5E9E0]/08 border border-[#F5E9E0]/12 rounded-3xl p-6 mb-8">
            <p className="text-[#F5E9E0] text-xl font-bold leading-snug mb-2">
              Preserve your family's voice,
            </p>
            <p className="text-[#D95D39] text-xl font-bold leading-snug">
              for every generation.
            </p>
            <p className="text-[#F5E9E0]/50 text-sm mt-3 leading-relaxed">
              Record stories in any language. Transcribed, translated, and saved for your whole family — forever.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['🎙 Record', '🌍 Translate', '📖 Preserve', '👨‍👩‍👧 Share'].map(f => (
              <span key={f} className="bg-[#F5E9E0]/10 text-[#F5E9E0] text-sm font-semibold px-4 py-1.5 rounded-full">
                {f}
              </span>
            ))}
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
    </div>
  )
}
