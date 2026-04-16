import { BookOpen } from 'lucide-react'

// Placeholder — full implementation in Phase 4
export default function Library() {
  return (
    <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center">
      <div className="text-center px-4">
        <BookOpen className="w-16 h-16 text-[#C8860A] mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[#5C3D2E] mb-2">You're in! 🎉</h1>
        <p className="text-gray-500 text-lg">Your family library is coming in Phase 4.</p>
      </div>
    </div>
  )
}
