import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Clock3, Tag } from 'lucide-react'
import { fallbackBlogImage, getPostCategory, getPostDate, getPostExcerpt, getPostTitle, getPostUrl, getReadingTime } from '../../utils/blog'

const BlogCard = ({ post, index = 0 }) => (
  <motion.article
    initial={{ opacity: 0, y: 24, scale: 0.98 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ delay: index * 0.07, duration: 0.5 }}
    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
  >
    <Link to={getPostUrl(post)} className="block" aria-label={`Learn more about ${getPostTitle(post)}`}>
      <div className="relative overflow-hidden">
        <img src={post.image || fallbackBlogImage} alt={getPostTitle(post)} className="h-52 w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur">
          <Tag className="h-3.5 w-3.5" />
          {getPostCategory(post)}
        </span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            {getPostDate(post)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-sky-600" />
            {getReadingTime(post)}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-black leading-tight text-slate-950">{getPostTitle(post)}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{getPostExcerpt(post)}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-700">
          Learn more
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  </motion.article>
)

export default BlogCard
