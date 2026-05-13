import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import BlogCard from './BlogCard'
import SectionHeader from './SectionHeader'

const BlogPreviewSection = ({ blogs }) => (
  <section id="blog" className="py-14 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          align="left"
          eyebrow="Blog / Learning Center"
          title="Restaurant Growth Guides & Digital Dining Insights"
          description="Learn how modern restaurants improve operations, reduce waiting time, and increase repeat customers using QR ordering systems."
        />
        <Link
          to="/blog"
          className="group inline-flex w-fit items-center gap-2 rounded-2xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-black text-primary-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-md sm:px-5 sm:py-3"
        >
          Read Article
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
        className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {blogs.map((post, index) => (
          <BlogCard key={post._id || post.key || post.title} post={post} index={index} />
        ))}
      </motion.div>
    </div>
  </section>
)

export default BlogPreviewSection
