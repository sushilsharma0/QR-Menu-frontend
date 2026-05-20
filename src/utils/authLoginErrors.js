/**
 * Formats vendor/staff login API errors for toast display.
 * @param {{ response?: { status?: number, data?: { message?: string, errors?: object } } }} error
 */
export function formatAuthLoginToast(error) {
  const status = error?.response?.status
  const payload = error?.response?.data?.errors || {}
  const message = error?.response?.data?.message || error?.message || 'Login failed'

  if (status === 423 || payload?.code === 'ACCOUNT_LOCKED') {
    const until = payload?.lockedUntil
      ? new Date(payload.lockedUntil).toLocaleString()
      : null
    const base =
      message ||
      'Your account is locked. Please contact platform administration to unlock access.'
    return {
      text: until ? `${base} (locked until ${until})` : base,
      duration: 10000,
      locked: true,
    }
  }

  if (status === 401 && payload?.code === 'LOGIN_FAILED') {
    const failed = payload?.failedAttempts
    const max = payload?.maxAttempts
    const remaining = payload?.attemptsRemaining
    if (Number.isFinite(failed) && Number.isFinite(max)) {
      return {
        text:
          message ||
          `Incorrect password. ${failed} of ${max} failed attempts — ${remaining} remaining before lock.`,
        duration: 7000,
        locked: false,
      }
    }
  }

  return { text: message, duration: 5000, locked: false }
}
