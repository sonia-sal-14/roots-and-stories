import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'kahani_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'android' | 'ios-safari' | 'ios-chrome' | null

export function useInstallPrompt() {
  const [androidPrompt, setAndroidPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<InstallPlatform>(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return

    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua)
    const isIOSChrome = isIOS && /CriOS/.test(ua)

    if (isIOS) {
      setPlatform(isIOSChrome ? 'ios-chrome' : 'ios-safari')
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setAndroidPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!androidPrompt) return
    await androidPrompt.prompt()
    const { outcome } = await androidPrompt.userChoice
    if (outcome === 'accepted') dismiss()
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setPlatform(null)
    setAndroidPrompt(null)
  }

  return { platform, install, dismiss }
}
