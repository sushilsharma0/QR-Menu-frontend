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
    <section id="feedback" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Customer Reviews"
          title="Real Restaurant Feedback Builds Trust"
          description="Customer reviews help restaurants build credibility and improve service quality. Reviews include ordering experience, service quality, and overall satisfaction."
        />

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          {feedbackTags.map((tag) => (
            <span key={tag} className="rounded-full border border-primary-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary-700 shadow-sm">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {feedback.slice(0, 6).map((item, index) => (
            <motion.article
              key={item._id || index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-primary-700">
                  {item.restaurant?.logo ? (
                    <img src={item.restaurant.logo} alt={item.restaurant?.name || 'Restaurant'} className="h-full w-full object-cover" />
                  ) : (
                    <MessageSquareQuote className="h-5 w-5" />
                  )}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star < Number(item.systemRating || 0) ? 'fill-primary-500 text-primary-500' : 'fill-slate-200 text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                {item.comment || 'Great service and smooth QR ordering experience.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-black text-primary-700">Easy to order</span>
                <span className="rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-black text-secondary-700">Great service</span>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-black text-slate-950">{item.customerName || 'Guest customer'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.restaurant?.name || 'Restaurant'} • Service {item.serviceRating || 'great'}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CustomerFeedbackSection
