import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import BlogCard from './BlogCard'
import SectionHeader from './SectionHeader'

const BlogPreviewSection = ({ blogs }) => (
  <section id="blog" className="py-16 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          align="left"
          eyebrow="Blog / Learning Center"
          title="Restaurant Growth Guides & Digital Dining Insights"
          description="Learn how modern restaurants improve operations, reduce waiting time, and increase repeat customers using QR ordering systems."
        />
        <Link to="/blog" className="inline-flex w-fit items-center gap-2 rounded-2xl border border-primary-200 bg-white px-5 py-3 text-sm font-black text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-50">
          Read Article
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
