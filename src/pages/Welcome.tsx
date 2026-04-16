import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#5C3D2E] via-[#C8860A] to-[#5C3D2E]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo mark */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-[#5C3D2E] rounded-3xl flex items-center justify-center shadow-xl mb-5 rotate-3">
              <span className="text-4xl">🌳</span>
            </div>
            <h1 className="text-5xl font-black text-[#5C3D2E] tracking-tight">kahani</h1>
            <p className="text-[#C8860A] font-semibold text-base mt-1 tracking-wide">
              कहानी · قصة · 故事
            </p>
          </div>

          {/* Tagline card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#5C3D2E]/8 mb-8">
            <p className="text-[#5C3D2E] text-xl font-bold leading-snug mb-2">
              Preserve your family's voice,
            </p>
            <p className="text-[#C8860A] text-xl font-bold leading-snug">
              for every generation.
            </p>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Record stories in any language. Transcribed, translated, and saved for your whole family — forever.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['🎙 Record', '🌍 Translate', '📖 Preserve', '👨‍👩‍👧 Share'].map(f => (
              <span key={f} className="bg-[#5C3D2E]/8 text-[#5C3D2E] text-sm font-semibold px-4 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button size="lg" className="w-full text-xl py-7 rounded-2xl font-bold shadow-lg" onClick={() => navigate('/signup')}>
              Get started
            </Button>
            <Button size="lg" variant="outline" className="w-full text-xl py-7 rounded-2xl font-bold" onClick={() => navigate('/signin')}>
              Sign in
            </Button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            🔒 Private & secure. Only your family can access your stories.
          </p>
        </div>
      </div>
    </div>
  )
}
