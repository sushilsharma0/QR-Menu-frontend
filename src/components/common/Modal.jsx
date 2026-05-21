import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-black/70"
        onClick={onClose}
      />

      <div className="relative flex h-full items-center justify-center p-4">
        <div className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white text-left shadow-[0_30px_90px_-36px_rgba(15,23,42,0.75)] ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900 ${sizes[size]}`}>
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gradient-to-r from-white via-primary-50/40 to-white px-6 py-4 dark:border-gray-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">QR Restro Nepal</p>
              <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-gray-100">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 active:scale-95 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default Modal
