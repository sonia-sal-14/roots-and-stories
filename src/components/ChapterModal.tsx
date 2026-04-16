import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen } from 'lucide-react'

interface ChapterModalProps {
  open: boolean
  onClose: () => void
  familyGroupId: string
  nextSortOrder: number
  onCreated: () => void
}

export function ChapterModal({ open, onClose, familyGroupId, nextSortOrder, onCreated }: ChapterModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!user || !title.trim()) { setError('Please enter a chapter name.'); return }
    setError('')
    setLoading(true)

    const { error } = await supabase.from('chapters').insert({
      family_group_id: familyGroupId,
      title: title.trim(),
      sort_order: nextSortOrder,
      created_by: user.id,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setTitle('')
    onCreated()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C8860A]" />
            Add a chapter
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-4">
          Chapters help organise your family's stories by theme or time period.
        </p>

        <div className="space-y-2 mb-4">
          <Label htmlFor="chapterTitle">Chapter name</Label>
          <Input
            id="chapterTitle"
            placeholder='e.g. "Life in the Village"'
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCreate} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : 'Create chapter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
