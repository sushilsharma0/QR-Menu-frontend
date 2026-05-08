import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, QrCode, Search } from 'lucide-react'
import BlogCard from '../components/landing/BlogCard'
import { fallbackBlogs } from '../components/landing/landingDefaults'
import api from '../services/api'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/platform/cms', { params: { type: 'blog', isActive: true }, skipErrorToast: true })
        setPosts(res.data?.data?.length ? res.data.data : fallbackBlogs)
      } catch (error) {
        setPosts(fallbackBlogs)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return posts
    return posts.filter((post) =>
      [post.title, post.content, post.metaDescription, post.key]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    )
  }, [posts, query])

  return (
    <div className="min-h-screen bg-[#f6faf7] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="text-lg font-black">QR Restro Nepal</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-700 shadow-sm">
              <FileText className="h-4 w-4" />
              Restaurant Learning Center
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              QR menu, restaurant SaaS, and digital ordering guides.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Explore practical articles with clear headings, reading time, and CMS-managed content for better learning and better SEO.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search QR menu, CMS, SaaS, ordering..."
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-12">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-96 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post, index) => <BlogCard key={post._id || post.key} post={post} index={index} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-lg font-black text-slate-950">No matching blog posts found.</p>
                <p className="mt-2 text-sm text-slate-500">Try a different search or publish more active Blog entries from the CMS.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Blog
