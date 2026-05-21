import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { MessagesSquare } from 'lucide-react'
import { FiPhone, FiX } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useLandingBranding } from '../../context/LandingBrandingContext'

function waLink(number, message) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return '#'
  const text = encodeURIComponent(message || 'Hi!')
  return `https://wa.me/${digits}?text=${text}`
}

function telHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  return `tel:+${digits}`
}

const LandingChatPopup = () => {
  const { chat, softwareName, themeTokens } = useLandingBranding()
  const [open, setOpen] = useState(false)

  if (!chat?.enabled) return null

  const mode = chat.mode || 'whatsapp'
  const showWa = mode === 'whatsapp' || mode === 'both'
  const showPhone = mode === 'phone' || mode === 'both'
  const phone = chat.displayPhone || chat.whatsappNumber
  const tel = telHref(phone)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`landing-chat-fab landing-chat-bounce fixed bottom-4 right-4 z-[70] inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-white shadow-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-primary-900/30 active:scale-95 sm:bottom-5 sm:right-5 sm:px-5 sm:py-3 ${themeTokens.primaryButton}`}
        aria-label="Open chat"
      >
        <MessagesSquare className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden />
        <span className="text-xs font-black tracking-tight sm:text-sm">Chat</span>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Contact">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              aria-label="Close"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-primary-700 to-secondary-600 px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white/80">Chat with us</p>
                  <p className="mt-1 text-lg font-black">{softwareName || 'Support'}</p>
                  <p className="mt-0.5 text-sm text-white/85">Choose a channel, we respond as soon as we can.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-white/90 hover:bg-white/10"
                  aria-label="Close dialog"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-2xl rounded-br-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                  <p className="font-bold text-slate-900">How can we help?</p>
                  <p className="mt-1">
                    Choose a channel below. WhatsApp opens in a new tab only if you tap the WhatsApp option.
                  </p>

                </div>
                {showWa && chat.whatsappNumber && (
                  <a
                    href={waLink(chat.whatsappNumber, chat.whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 font-bold text-emerald-900 transition hover:bg-emerald-100"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-white">
                      <FaWhatsapp className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block text-sm text-emerald-800/80">WhatsApp</span>
                      <span className="text-base">Message on WhatsApp</span>
                    </span>
                  </a>
                )}
                {showPhone && tel && (
                  <a
                    href={tel}
                    className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 font-bold text-slate-900 transition hover:bg-surface-100"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
                      <FiPhone className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm text-slate-500">Call</span>
                      <span className="text-base">{chat.displayPhone || `+${String(chat.whatsappNumber || '').replace(/\D/g, '')}`}</span>
                    </span>
                  </a>
                )}
                {!showWa && !showPhone && <p className="text-sm text-slate-600">Contact options are not configured.</p>}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default LandingChatPopup
