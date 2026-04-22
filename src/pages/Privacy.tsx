import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader showBack backTo="/welcome" title="Privacy Policy" />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

        <div>
          <h1 className="text-3xl font-black text-[#F5E9E0] tracking-tight">Privacy Policy</h1>
          <p className="text-[#D5D9EC]/50 text-sm mt-1">Last updated: April 2026</p>
        </div>

        <div className="bg-[#F5E9E0] rounded-3xl p-6 shadow-lg space-y-6">

          <section>
            <h2 className="text-lg font-black text-[#3B2B3A] mb-2">The short version</h2>
            <p className="text-[#3B2B3A]/70 leading-relaxed">
              Kahani is a private family memory app. We store your stories so your family can
              hear them. We don't sell your data, show you ads, or share your recordings with
              anyone outside your family group — ever.
            </p>
          </section>

          <div className="border-t border-[#3B2B3A]/08" />

          <section>
            <h2 className="text-lg font-black text-[#3B2B3A] mb-2">What we collect</h2>
            <ul className="space-y-2 text-[#3B2B3A]/70 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Email address</strong> — used to create your account and for password resets.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Display name & profile photo</strong> — shown to your family members inside the app.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Audio recordings</strong> — stored privately and only accessible to members of your family group.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Transcripts & translations</strong> — generated from your recordings and stored alongside them.</span></li>
            </ul>
          </section>

          <div className="border-t border-[#3B2B3A]/08" />

          <section>
            <h2 className="text-lg font-black text-[#3B2B3A] mb-2">How we use it</h2>
            <ul className="space-y-2 text-[#3B2B3A]/70 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span>To show your stories to your family group and no one else.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span>To transcribe and translate your recordings into English so all family members can follow along.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span>To send password reset emails when you request them.</span></li>
            </ul>
            <p className="text-[#3B2B3A]/70 leading-relaxed mt-3">
              We do not use your content to train AI models, run ads, or share it with third parties
              for any marketing purpose.
            </p>
          </section>

          <div className="border-t border-[#3B2B3A]/08" />

          <section>
            <h2 className="text-lg font-black text-[#3B2B3A] mb-2">Third-party services</h2>
            <p className="text-[#3B2B3A]/70 leading-relaxed mb-3">
              Kahani uses the following services to function. Your audio is sent to them only
              when you record a story, solely to produce transcripts and translations.
            </p>
            <ul className="space-y-2 text-[#3B2B3A]/70 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Supabase</strong> — stores your account, family data, and audio files. Data is encrypted at rest. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D95D39] hover:underline">Privacy policy →</a></span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">OpenAI (Whisper)</strong> — transcribes your audio recording into text. <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#D95D39] hover:underline">Privacy policy →</a></span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Anthropic (Claude)</strong> — translates your transcript to English and suggests a chapter category. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D95D39] hover:underline">Privacy policy →</a></span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span><strong className="text-[#3B2B3A]">Vercel</strong> — hosts the app and processes AI requests on the server. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#D95D39] hover:underline">Privacy policy →</a></span></li>
            </ul>
          </section>

          <div className="border-t border-[#3B2B3A]/08" />

          <section>
            <h2 className="text-lg font-black text-[#3B2B3A] mb-2">Your data, your control</h2>
            <ul className="space-y-2 text-[#3B2B3A]/70 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span>You can leave your family group or delete your account at any time from Account Settings.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span>Stories you've recorded remain in your family's library when you leave — they belong to your family, not just your account.</span></li>
              <li className="flex gap-2"><span className="text-[#D95D39] font-bold flex-shrink-0">·</span><span>Deleting your account removes your login credentials and your membership from all family groups.</span></li>
            </ul>
          </section>

          <div className="border-t border-[#3B2B3A]/08" />

          <section>
            <h2 className="text-lg font-black text-[#3B2B3A] mb-2">Questions?</h2>
            <p className="text-[#3B2B3A]/70 leading-relaxed">
              Kahani is an independent project. If you have any questions or concerns about your data,
              please reach out directly to the person who shared this app with you.
            </p>
          </section>

        </div>

        <p className="text-center text-[#D5D9EC]/40 text-xs pb-8">
          Built with care for family memories.
        </p>
      </div>
    </div>
  )
}
