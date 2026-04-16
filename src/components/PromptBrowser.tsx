import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoryPrompt } from '@/types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'

const CATEGORIES = ['All', 'Childhood', 'Family & Traditions', 'Cultural Heritage', 'Recent Memories']

interface PromptBrowserProps {
  open: boolean
  onClose: () => void
  onSelect: (prompt: string) => void
}

export function PromptBrowser({ open, onClose, onSelect }: PromptBrowserProps) {
  const [prompts, setPrompts] = useState<StoryPrompt[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase
      .from('story_prompts')
      .select('*')
      .order('category')
      .then(({ data }) => {
        if (data) setPrompts(data)
        setLoading(false)
      })
  }, [open])

  const filtered = activeCategory === 'All'
    ? prompts
    : prompts.filter(p => p.category === activeCategory)

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C8860A]" />
            Story inspiration
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-4">
          Pick a prompt to spark a memory. It'll be added as your story title.
        </p>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#5C3D2E] text-white'
                  : 'bg-[#FDF6EE] text-[#5C3D2E] hover:bg-[#5C3D2E]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Prompts list */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#5C3D2E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No prompts in this category.</p>
          ) : (
            filtered.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => { onSelect(prompt.prompt_text); onClose() }}
                className="w-full text-left p-4 rounded-xl bg-[#FDF6EE] hover:bg-[#5C3D2E]/10 border border-transparent hover:border-[#5C3D2E]/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-[#C8860A] uppercase tracking-wide block mb-1">
                      {prompt.category}
                    </span>
                    <span className="text-[#5C3D2E] font-medium group-hover:text-[#4a3124]">
                      {prompt.prompt_text}
                    </span>
                  </div>
                  <span className="text-xs text-[#5C3D2E]/40 group-hover:text-[#5C3D2E] flex-shrink-0 pt-5">
                    Use →
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
