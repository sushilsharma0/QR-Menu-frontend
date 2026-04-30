import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Star, Send, ThumbsUp, ThumbsDown, Meh } from 'lucide-react'

const feedbackOptions = [
  { id: 1, icon: ThumbsUp, label: 'Great', color: 'text-green-500', bg: 'bg-green-50' },
  { id: 2, icon: Meh, label: 'Average', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 3, icon: ThumbsDown, label: 'Poor', color: 'text-red-500', bg: 'bg-red-50' },
]

export default function Feedback({ isOpen, onClose }) {
  const [selectedRating, setSelectedRating] = useState(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

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

  const handleSubmit = () => {
    if (selectedRating) {
      setSubmitted(true)
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setSelectedRating(null)
        setComment('')
      }, 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden z-50 shadow-2xl"
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-linear-to-r from-blue-500 to-indigo-500 mx-4 mt-4 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Star size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Feedback</h2>
                    <p className="text-sm opacity-90">Help us improve!</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Feedback Form */}
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star size={40} className="text-green-500 fill-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Thank You!</h3>
                  <p className="text-gray-500 mt-2">Your feedback has been submitted</p>
                </div>
              ) : (
                <>
                  {/* Rating Selection */}
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-3">How was your experience?</p>
                    <div className="flex justify-between gap-2">
                      {feedbackOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedRating(option.id)}
                          className={`flex-1 p-4 rounded-2xl ${option.bg} border-2 transition-all ${
                            selectedRating === option.id 
                              ? 'border-gray-400 scale-95' 
                              : 'border-transparent'
                          }`}
                        >
                          <option.icon size={24} className={`mx-auto mb-2 ${option.color}`} />
                          <span className="text-xs font-bold text-gray-600">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Box */}
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">Additional comments (optional)</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us more about your experience..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-orange-500"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedRating}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${
                      selectedRating 
                        ? 'bg-orange-500 text-white hover:bg-orange-600' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send size={18} />
                    Submit Feedback
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}