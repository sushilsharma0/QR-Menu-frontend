import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, FileText, QrCode, Search } from 'lucide-react'
import api from '../services/api'

const fallbackImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/platform/cms', { params: { type: 'blog', isActive: true } })
        setPosts(res.data?.data || [])
      } catch (error) {
        setPosts([])
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
            <span className="text-lg font-black">QR Menu</span>
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
              Platform Blog
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Restaurant tech insights, updates, and guides.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Articles are published from the platform admin CMS, so your team can manage announcements without code changes.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search blog posts"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-12">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-80 animate-pulse rounded-lg bg-white" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <article key={post._id || post.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <img src={post.image || fallbackImage} alt={post.title || 'Blog post'} className="h-52 w-full object-cover" />
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <CalendarDays className="h-4 w-4 text-emerald-600" />
                        {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : 'Platform update'}
                      </div>
                      <h2 className="mt-3 text-xl font-black leading-tight text-slate-950">{post.title || post.key}</h2>
                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">
                        {post.metaDescription || post.content || 'No article summary added yet.'}
                      </p>
                      <div className="mt-5 border-t border-slate-100 pt-4 text-sm leading-7 text-slate-700">
                        {post.content}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-lg font-black text-slate-950">No blog posts published yet.</p>
                <p className="mt-2 text-sm text-slate-500">Create active CMS entries with type `Blog` from the platform admin panel.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Blog
