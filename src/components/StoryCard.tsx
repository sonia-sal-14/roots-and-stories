import { useNavigate } from 'react-router-dom'
import type { Story, FamilyMember } from '@/types/database'
import { Play } from 'lucide-react'

interface StoryCardProps {
  story: Story
  member?: FamilyMember
}

export function StoryCard({ story, member }: StoryCardProps) {
  const navigate = useNavigate()

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="bg-[#F5E9E0] rounded-2xl p-4 cursor-pointer border border-transparent transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_24px_rgba(217,93,57,0.3)] hover:-translate-y-0.5 hover:border-[#D95D39]/20 group"
      onClick={() => navigate(`/story/${story.id}`)}
    >
      <div className="flex items-center gap-3">
        {/* Play button */}
        <div className="w-12 h-12 rounded-xl bg-[#3B2B3A] group-hover:bg-[#D95D39] flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">
          <Play className="w-5 h-5 text-[#F5E9E0] fill-current ml-0.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#3B2B3A] text-sm leading-snug mb-1 truncate">
            {story.title}
          </h3>
          {story.transcript_english && (
            <p className="text-[#3B2B3A]/55 text-xs leading-relaxed line-clamp-2 mb-1.5">
              {story.transcript_english.slice(0, 100)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {member && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-[#3B3B58] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D5D9EC] text-[9px] font-bold">
                    {member.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[#3B2B3A]/40 text-[10px]">{member.display_name}</span>
              </div>
            )}
            <span className="bg-[#D95D39]/12 text-[#D95D39] font-bold text-[10px] px-2.5 py-1 rounded-full">
              {story.original_language}
            </span>
            <span className="text-[#3B2B3A]/40 text-[10px]">{formatDate(story.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
