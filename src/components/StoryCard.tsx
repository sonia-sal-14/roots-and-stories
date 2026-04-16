import { useNavigate } from 'react-router-dom'
import type { Story, FamilyMember } from '@/types/database'
import { Play, Mic, Calendar, User } from 'lucide-react'

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
      className="bg-white rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-[#5C3D2E]/10"
      onClick={() => navigate(`/story/${story.id}`)}
    >
      <div className="flex items-center gap-3">
        {/* Play button */}
        <div className="w-12 h-12 rounded-2xl bg-[#FDF6EE] group-hover:bg-[#5C3D2E] flex items-center justify-center flex-shrink-0 transition-colors">
          <Play className="w-5 h-5 text-[#5C3D2E] group-hover:text-white fill-current transition-colors ml-0.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#5C3D2E] text-sm leading-snug mb-1 truncate group-hover:text-[#4a3124] transition-colors">
            {story.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
            {member && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />{member.display_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3" />{story.original_language}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />{formatDate(story.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Audio player */}
      {story.audio_url && (
        <div className="mt-3 pl-15" onClick={e => e.stopPropagation()}>
          <audio controls src={story.audio_url} className="w-full h-8" preload="none" />
        </div>
      )}
    </div>
  )
}
