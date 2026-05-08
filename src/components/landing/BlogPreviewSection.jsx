import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import BlogCard from './BlogCard'
import SectionHeader from './SectionHeader'

const BlogPreviewSection = ({ blogs }) => (
  <section id="blog" className="bg-white/80 py-16 backdrop-blur sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          align="left"
          eyebrow="Learning Center"
          title="Restaurant growth guides written for search and real operators."
          description="Each card opens a full guide with SEO-friendly headings, date, category, and reading time."
        />
        <Link to="/blog" className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5">
          View all posts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {blogs.map((post, index) => <BlogCard key={post._id || post.key || post.title} post={post} index={index} />)}
      </div>
    </div>
  </section>
)

export default BlogPreviewSection
