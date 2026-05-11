import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Star, Send, ThumbsUp, ThumbsDown, Meh, CheckCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { ensureGuestSession, getStoredGuestId } from '../../../services/customer'

const feedbackOptions = [
  { id: 'great', icon: ThumbsUp,   label: 'Great',   color: 'text-primary-600',  bg: 'bg-primary-50',  border: 'border-primary-400',  activeBg: 'bg-primary-600'  },
  { id: 'average', icon: Meh,        label: 'Average', color: 'text-accent-600', bg: 'bg-accent-50', border: 'border-accent-400', activeBg: 'bg-accent-600' },
  { id: 'poor', icon: ThumbsDown, label: 'Poor',    color: 'text-secondary-600',    bg: 'bg-secondary-50',    border: 'border-secondary-400',    activeBg: 'bg-secondary-600'    },
]

const starLabels = ['Terrible', 'Bad', 'Okay', 'Good', 'Excellent']

export default function Feedback({ isOpen, onClose, qrToken }) {
  const { slug, token, qrToken: routeQrToken } = useParams()
  const activeQrToken = qrToken || token || routeQrToken
  const [selectedRating, setSelectedRating] = useState(null)
  const [hoveredStar, setHoveredStar]       = useState(0)
  const [starRating, setStarRating]         = useState(0)
  const [comment, setComment]               = useState('')
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState('')
  const [submitted, setSubmitted]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedbackEnabled, setFeedbackEnabled] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      if (!slug) return
      try {
        const res = await api.get(`/customer/feedback/settings/${slug}`, { skipErrorToast: true })
        setFeedbackEnabled(res.data?.data?.feedbackEnabled !== false)
      } catch (error) {
        setFeedbackEnabled(true)
      }
    }
    fetchSettings()
  }, [slug])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubmitted(false)
        setSelectedRating(null)
        setStarRating(0)
        setHoveredStar(0)
        setComment('')
        setReviewPhotoUrl('')
      }, 300)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!selectedRating || !starRating) return
    try {
      setSubmitting(true)
      let guestIdForFeedback = getStoredGuestId() || undefined
      try {
        const session = await ensureGuestSession(activeQrToken)
        if (session?.guestId) guestIdForFeedback = session.guestId
      } catch {
        /* Table QR session fails for per-order tracking tokens; API resolves order + guest. */
      }
      await api.post('/customer/feedback', {
        qrToken: activeQrToken,
        guestId: guestIdForFeedback,
        systemRating: starRating,
        serviceRating: selectedRating,
        comment,
        reviewImages: reviewPhotoUrl.trim() ? [reviewPhotoUrl.trim()] : [],
      })
      setSubmitted(true)
      setTimeout(() => onClose(), 2500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const activeStars = hoveredStar || starRating

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden z-50 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Star size={18} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800 leading-none">
                    Rate your experience
                  </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Your feedback helps this restaurant improve</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Thin divider */}
            <div className="mx-5 h-px bg-gray-100" />

            {/* Body */}
            <div className="px-5 pt-4 pb-6 overflow-y-auto max-h-[68vh]">
              <AnimatePresence mode="wait">

                {/* ── Success state */}
                {!feedbackEnabled ? (
                  <motion.div
                    key="disabled"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-primary-600">
                      <Star size={30} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Feedback is closed right now</h3>
                    <p className="mt-1 text-sm text-gray-400">The restaurant has disabled customer feedback for this portal.</p>
                  </motion.div>
                ) : submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14 }}
                      className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4"
                    >
                      <CheckCircle size={32} className="text-green-500" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-800">Thank you!</h3>
                    <p className="text-sm text-gray-400 mt-1">Your feedback has been submitted</p>
                  </motion.div>

                ) : (

                  // ── Form state
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >

                    {/* Star rating */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        How did this QR ordering system feel?
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setStarRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                          >
                            <Star
                              size={32}
                              className={`transition-colors ${
                                star <= activeStars
                                  ? 'text-primary-500 fill-primary-500'
                                  : 'text-gray-200 fill-gray-200'
                              }`}
                            />
                          </motion.button>
                        ))}
                        {/* Label */}
                        {activeStars > 0 && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-sm font-semibold text-primary-600 ml-1"
                          >
                            {starLabels[activeStars - 1]}
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Quick feedback chips */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        How was the restaurant service?
                      </p>
                      <div className="flex gap-2">
                        {feedbackOptions.map((opt) => {
                          const isSelected = selectedRating === opt.id
                          return (
                            <motion.button
                              key={opt.id}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => setSelectedRating(opt.id)}
                              className={`flex-1 py-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                                isSelected
                                  ? `${opt.activeBg} ${opt.border} border-2`
                                  : `${opt.bg} border-transparent`
                              }`}
                            >
                              <opt.icon
                                size={22}
                                className={isSelected ? 'text-white' : opt.color}
                              />
                              <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                {opt.label}
                              </span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Comment box */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Tell us more{' '}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </p>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you love or what can we improve?"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-orange-400 transition-colors placeholder:text-gray-300 text-gray-700"
                        rows={3}
                      />
                      <p className="mt-3 text-sm font-semibold text-gray-700 mb-2">
                        Review photo URL <span className="text-gray-400 font-normal">(optional)</span>
                      </p>
                      <input
                        type="url"
                        value={reviewPhotoUrl}
                        onChange={(e) => setReviewPhotoUrl(e.target.value)}
                        placeholder="Link to a photo (e.g. Cloudinary or image URL)"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 text-gray-700"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmit}
                      disabled={!selectedRating || !starRating || submitting}
                      className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        selectedRating && starRating
                          ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-100'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send size={15} />
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </motion.button>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
