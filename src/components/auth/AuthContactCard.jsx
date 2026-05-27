import React, { useEffect, useMemo, useState } from 'react'
import { FiMail, FiMessageCircle, FiPhone } from 'react-icons/fi'
import api from '../../services/api'

const fallbackContact = {
  supportEmail: 'support@example.com',
  contactPhone: '+977 9800000000',
  chat: {
    whatsappNumber: '9779800000000',
    whatsappMessage: 'Hi, I need help with my account.',
    displayPhone: '',
  },
}

const AuthContactCard = ({ title = 'Need help?', description = 'Contact our support team for login, signup, onboarding, or account access help.' }) => {
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    let cancelled = false

    api
      .get('/customer/landing/site-config', { skipErrorToast: true })
      .then((res) => {
        if (!cancelled) setSiteConfig(res.data?.data || null)
      })
      .catch(() => {
        if (!cancelled) setSiteConfig(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const contact = useMemo(() => {
    const chat = siteConfig?.chat || fallbackContact.chat
    const phone = String(chat?.displayPhone || chat?.whatsappNumber || siteConfig?.contactPhone || fallbackContact.contactPhone).trim()
    const phoneDigits = phone.replace(/\D/g, '')
    const email = String(siteConfig?.supportEmail || fallbackContact.supportEmail).trim()
    const whatsappMessage = encodeURIComponent(chat?.whatsappMessage || fallbackContact.chat.whatsappMessage)

    return {
      email,
      phone,
      phoneDigits,
      whatsappHref: phoneDigits ? `https://wa.me/${phoneDigits}?text=${whatsappMessage}` : 'https://wa.me/',
    }
  }, [siteConfig])

  return (
    <div className="rounded-xl border border-[#f1b089]/40 bg-[#fff7ed] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a43a12] shadow-sm">
          <FiMessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#8f2a05]">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-[#7c260b]/80">{description}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#7c260b] shadow-sm transition hover:text-[#5f1d08] hover:shadow"
        >
          <FiPhone className="h-4 w-4 shrink-0 text-[#a43a12]" />
          <span className="truncate">{contact.phone}</span>
        </a>
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex min-w-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#7c260b] shadow-sm transition hover:text-[#5f1d08] hover:shadow"
        >
          <FiMail className="h-4 w-4 shrink-0 text-[#a43a12]" />
          <span className="truncate">{contact.email}</span>
        </a>
      </div>
    </div>
  )
}

export default AuthContactCard
