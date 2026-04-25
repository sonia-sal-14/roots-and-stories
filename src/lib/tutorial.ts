const KEY = 'kahani_tutorial_step'

export const getTutorialStep = (): string | null => localStorage.getItem(KEY)

export const setTutorialStep = (step: number | 'done'): void =>
  localStorage.setItem(KEY, String(step))

export const initTutorial = (): void => {
  if (!localStorage.getItem(KEY)) setTutorialStep(1)
}

export const skipTutorial = (): void => setTutorialStep('done')
