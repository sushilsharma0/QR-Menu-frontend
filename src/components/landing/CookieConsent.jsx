import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Cookie, X } from 'lucide-react'

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted'

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    try {
      setIsVisible(window.localStorage.getItem(COOKIE_CONSENT_KEY) !== 'true')
    } catch {
      setIsVisible(true)
    }
  }, [])

  const acceptCookies = () => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    } catch {
      // The banner can still close if localStorage is unavailable.
    }

    setIsVisible(false)
  }

  if (!mounted || !isVisible) return null

  return createPortal(
    <section
      className="fixed inset-x-0 bottom-0 z-[75] px-3 pb-3 sm:px-5 sm:pb-5"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-800 shadow-2xl shadow-slate-950/15 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Cookie className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-slate-950 sm:text-base">
            We use cookies
          </h2>
          <p className="mt-1 text-xs leading-6 text-slate-600 sm:text-sm">
            We use essential cookies and similar storage to keep the site working, remember your preferences, and improve your experience.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={acceptCookies}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-black text-white shadow-lg shadow-primary-900/20 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={acceptCookies}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Close cookie notice"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </section>,
    document.body,
  )
}

export default CookieConsent
