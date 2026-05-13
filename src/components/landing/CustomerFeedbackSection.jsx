import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquareQuote, Star } from 'lucide-react'
import api from '../../services/api'
import SectionHeader from './SectionHeader'

const feedbackTags = ['Ordering experience', 'Service quality', 'Guest satisfaction']

const fallbackFeedback = [
  {
    _id: 'fallback-1',
    customerName: 'Guest Customer',
    systemRating: 5,
    serviceRating: 'great',
    comment: 'The QR ordering experience was smooth and very easy to use. Food arrived quickly and the menu looked modern.',
    restaurant: { name: 'The Chiya Hub', logo: '' },
  },
  {
    _id: 'fallback-2',
    customerName: 'Restaurant Owner',
    systemRating: 5,
    serviceRating: 'great',
    comment: 'Ordering became faster for our customers and our kitchen workflow is now much more organized.',
    restaurant: { name: 'Local Restaurant', logo: '' },
  },
  {
    _id: 'fallback-3',
    customerName: 'Cafe Manager',
    systemRating: 5,
    serviceRating: 'great',
    comment: 'Very practical system for restaurants in Nepal. Easy setup and clean dashboard.',
    restaurant: { name: 'Cafe Partner', logo: '' },
  },
]

const CustomerFeedbackSection = () => {
  const [feedback, setFeedback] = useState([])

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get('/customer/feedback/public', { skipErrorToast: true })
        setFeedback(res.data?.data?.length ? res.data.data : fallbackFeedback)
      } catch (error) {
        setFeedback(fallbackFeedback)
      }
    }
    fetchFeedback()
  }, [])

  return (
    <section id="feedback" className="py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Customer Reviews"
          title="Real Restaurant Feedback Builds Trust"
          description="Customer reviews help restaurants build credibility and improve service quality. Reviews include ordering experience, service quality, and overall satisfaction."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
          className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3"
        >
          {feedbackTags.map((tag) => (
            <motion.span
              key={tag}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
              }}
              className="rounded-full border border-primary-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {feedback.slice(0, 6).map((item, index) => (
            <motion.article
              key={item._id || index}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-xl sm:p-6"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-primary-700 sm:h-12 sm:w-12">
                  {item.restaurant?.logo ? (
                    <img src={item.restaurant.logo} alt={item.restaurant?.name || 'Restaurant'} className="h-full w-full object-cover" />
                  ) : (
                    <MessageSquareQuote className="h-5 w-5" />
                  )}
                </span>
                <div className="flex gap-0.5 sm:gap-1">
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star < Number(item.systemRating || 0) ? 'fill-primary-500 text-primary-500' : 'fill-slate-200 text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600 sm:mt-5">
                {item.comment || 'Great service and smooth QR ordering experience.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-black text-primary-700 sm:px-3 sm:py-1 sm:text-[11px]">
                  Easy to order
                </span>
                <span className="rounded-full bg-secondary-50 px-2.5 py-0.5 text-[10px] font-black text-secondary-700 sm:px-3 sm:py-1 sm:text-[11px]">
                  Great service
                </span>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3 sm:mt-5 sm:pt-4">
                <p className="text-sm font-black text-slate-950">{item.customerName || 'Guest customer'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.restaurant?.name || 'Restaurant'} • Service {item.serviceRating || 'great'}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default CustomerFeedbackSection
