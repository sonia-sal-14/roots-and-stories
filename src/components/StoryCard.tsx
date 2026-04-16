import { useNavigate } from 'react-router-dom'
import type { Story, FamilyMember } from '@/types/database'
import { Play, Mic, Calendar, User } from 'lucide-react'

interface StoryCardProps {
  story: Story
  member?: FamilyMember
}

export function StoryCard({ story, member }: StoryCardProps) {
  const navigate = useNavigate()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  return (
    <div
      className="bg-white rounded-xl border border-[#5C3D2E]/10 p-4 hover:shadow-md hover:border-[#5C3D2E]/30 transition-all cursor-pointer group"
      onClick={() => navigate(`/story/${story.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-[#5C3D2E] text-base leading-snug mb-2 group-hover:text-[#4a3124] transition-colors">
            {story.title}
          </h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            {member && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {member.display_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" />
              {story.original_language}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(story.created_at)}
            </span>
          </div>

          {/* Audio player */}
          {story.audio_url && (
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              <audio
                controls
                src={story.audio_url}
                className="w-full h-9"
                preload="none"
              />
            </div>
          )}
        </div>

        {/* Play icon hint */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#FDF6EE] flex items-center justify-center group-hover:bg-[#5C3D2E] transition-colors mt-0.5">
          <Play className="w-4 h-4 text-[#5C3D2E] group-hover:text-white transition-colors fill-current" />
        </div>
      </div>
    </div>
  )
}
