import { useState } from 'react'
import { getTutorialStep, setTutorialStep, skipTutorial } from '@/lib/tutorial'

export function useTutorial() {
  const [step, setStep] = useState<string | null>(() => getTutorialStep())

  const advance = () => {
    const current = getTutorialStep()
    const num = Number(current)
    if (!isNaN(num) && num >= 1 && num <= 3) {
      setTutorialStep(num + 1)
      setStep(String(num + 1))
    } else {
      skipTutorial()
      setStep('done')
    }
  }

  const skip = () => {
    skipTutorial()
    setStep('done')
  }

  const isActive = step !== null && step !== 'done'

  return { step, advance, skip, isActive }
}
