import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { AppHeader } from '@/components/AppHeader'
import { LogOut, UserMinus, Trash2, ChevronRight, Shield } from 'lucide-react'

type ConfirmMode = null | 'leave' | 'delete'

export default function AccountSettings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/welcome')
  }

  const handleLeaveFamily = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('user_id', user.id)

    setLoading(false)

    if (error) {
      setError('Something went wrong. Please try again.')
      return
    }

    // Sign out so they land cleanly on the welcome screen
    await signOut()
    navigate('/welcome')
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // Account is gone — sign out locally and go home
    await signOut()
    navigate('/welcome')
  }

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader showBack backTo="/library" title="Account" />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-4">

        {/* Account info */}
        <div className="bg-[#F5E9E0] rounded-3xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-[#3B2B3A]/40 uppercase tracking-widest mb-1">Signed in as</p>
          <p className="font-bold text-[#3B2B3A] truncate">{user?.email}</p>
        </div>

        {/* Actions */}
        <div className="bg-[#F5E9E0] rounded-3xl shadow-lg overflow-hidden">

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#3B2B3A]/05 transition-colors border-b border-[#3B2B3A]/08"
          >
            <div className="w-9 h-9 rounded-xl bg-[#3B3B58]/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-[#3B3B58]" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-[#3B2B3A]">Sign out</div>
              <div className="text-xs text-[#3B2B3A]/50">You can always sign back in</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#3B2B3A]/25" />
          </button>

          {/* Privacy policy */}
          <Link
            to="/privacy"
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#3B2B3A]/05 transition-colors border-b border-[#3B2B3A]/08"
          >
            <div className="w-9 h-9 rounded-xl bg-[#3B3B58]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-[#3B3B58]" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-[#3B2B3A]">Privacy policy</div>
              <div className="text-xs text-[#3B2B3A]/50">How we handle your data</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#3B2B3A]/25" />
          </Link>

          {/* Leave family */}
          <button
            onClick={() => setConfirmMode('leave')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#3B2B3A]/05 transition-colors border-b border-[#3B2B3A]/08"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <UserMinus className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-[#3B2B3A]">Leave family group</div>
              <div className="text-xs text-[#3B2B3A]/50">Your stories stay; you lose access</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#3B2B3A]/25" />
          </button>

          {/* Delete account */}
          <button
            onClick={() => setConfirmMode('delete')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-red-600">Delete account</div>
              <div className="text-xs text-red-400">Permanently removes your login</div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>
        )}
      </div>

      {/* Confirmation overlay — Leave family */}
      {confirmMode === 'leave' && (
        <ConfirmSheet
          emoji="👋"
          title="Leave family group?"
          body="You'll lose access to your family's story library. Your recordings will stay — they belong to the family. You can re-join later with the invite code."
          confirmLabel="Leave family"
          confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
          loading={loading}
          onConfirm={handleLeaveFamily}
          onCancel={() => { setConfirmMode(null); setError('') }}
        />
      )}

      {/* Confirmation overlay — Delete account */}
      {confirmMode === 'delete' && (
        <ConfirmSheet
          emoji="⚠️"
          title="Delete your account?"
          body="This permanently deletes your login. Your recorded stories will remain in your family's library. This cannot be undone."
          confirmLabel="Yes, delete my account"
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          loading={loading}
          onConfirm={handleDeleteAccount}
          onCancel={() => { setConfirmMode(null); setError('') }}
        />
      )}
    </div>
  )
}

// ── Reusable bottom sheet confirmation ────────────────────────────────────────

interface ConfirmSheetProps {
  emoji: string
  title: string
  body: string
  confirmLabel: string
  confirmClass: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmSheet({ emoji, title, body, confirmLabel, confirmClass, loading, onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-[#F5E9E0] rounded-t-3xl px-6 py-8 space-y-5 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-3">{emoji}</div>
          <h3 className="text-xl font-black text-[#3B2B3A]">{title}</h3>
          <p className="text-[#3B2B3A]/60 text-sm leading-relaxed mt-2">{body}</p>
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${confirmClass} disabled:opacity-60`}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Working...
              </span>
            : confirmLabel}
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full py-3 text-[#3B2B3A]/50 font-semibold hover:text-[#3B2B3A] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
