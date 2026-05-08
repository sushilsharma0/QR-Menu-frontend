import React from 'react'
import { FaWhatsapp } from 'react-icons/fa'

const WhatsAppFloatButton = () => (
  <a
    href="https://wa.me/9779800000000?text=Hi%20QR%20Restro%20Nepal%2C%20I%20want%20to%20know%20more%20about%20the%20platform."
    target="_blank"
    rel="noreferrer"
    aria-label="Chat on WhatsApp"
    className="fixed bottom-5 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-900/35 transition hover:scale-105"
  >
    <span className="absolute -inset-1 rounded-full border-2 border-[#25D366]/60 animate-ping" />
    <FaWhatsapp className="relative h-7 w-7" />
  </a>
)

export default WhatsAppFloatButton
