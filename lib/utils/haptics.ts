export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'medium') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return

  const patterns = {
    light: 10,
    medium: 25,
    heavy: 50,
  }

  try {
    navigator.vibrate(patterns[type])
  } catch {
    // Vibration not supported
  }
}

export function hapticSuccess() {
  hapticFeedback('medium')
}

export function hapticError() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try {
    navigator.vibrate([50, 50, 50])
  } catch {
    // Vibration not supported
  }
}
