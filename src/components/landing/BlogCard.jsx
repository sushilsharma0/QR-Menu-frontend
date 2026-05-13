import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Clock3, Tag } from 'lucide-react'
import { fallbackBlogImage, getPostCategory, getPostDate, getPostExcerpt, getPostTitle, getPostUrl, getReadingTime } from '../../utils/blog'

const BlogCard = ({ post }) => (
  <motion.article
    variants={{
      hidden: { opacity: 0, y: 24, scale: 0.98 },
      show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    }}
    whileHover={{ y: -6 }}
    className="group overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-xl"
  >
    <Link to={getPostUrl(post)} className="block" aria-label={`Learn more about ${getPostTitle(post)}`}>
      <div className="relative overflow-hidden">
        <img
          src={post.image || fallbackBlogImage}
          alt={getPostTitle(post)}
          loading="lazy"
          className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-110 sm:h-48 md:h-52"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-black text-primary-700 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
          <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {getPostCategory(post)}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:gap-3 sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary-600 sm:h-4 sm:w-4" />
            {getPostDate(post)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-secondary-600 sm:h-4 sm:w-4" />
            {getReadingTime(post)}
          </span>
        </div>
        <h3 className="mt-2.5 text-lg font-black leading-tight text-slate-950 sm:mt-3 sm:text-xl">
          {getPostTitle(post)}
        </h3>
        <p className="mt-2.5 line-clamp-3 text-sm leading-7 text-slate-600 sm:mt-3">{getPostExcerpt(post)}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary-700 sm:mt-5">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </span>
      </div>
    </Link>
  </motion.article>
)

export default BlogCard
