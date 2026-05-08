import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock3, Tag } from 'lucide-react'
import { fallbackBlogs } from '../components/landing/landingDefaults'
import api from '../services/api'
import { fallbackBlogImage, getPostCategory, getPostDate, getPostExcerpt, getPostTitle, getReadingTime } from '../utils/blog'

const splitContent = (content) => String(content || '').split(/\n+/).map((item) => item.trim()).filter(Boolean)

const BlogDetail = () => {
  const { key } = useParams()
  const decodedKey = decodeURIComponent(key || '')
  const fallbackPost = fallbackBlogs.find((post) => post.key === decodedKey)
  const [post, setPost] = useState(fallbackPost || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/platform/cms/${decodedKey}`, { skipErrorToast: true })
        setPost(res.data?.data || fallbackPost || null)
      } catch (error) {
        setPost(fallbackPost || null)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [decodedKey, fallbackPost])

  const paragraphs = useMemo(() => splitContent(post?.content || post?.metaDescription), [post])
  const title = getPostTitle(post)

  if (loading) {
    return <div className="min-h-screen bg-[#f6faf7] p-8 text-center text-sm font-bold text-slate-500">Loading article...</div>
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6faf7] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Blog post not found</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">This CMS blog entry is not available or has been unpublished.</p>
          <Link to="/blog" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Back to blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-slate-950">
      <main>
        <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <header className="mt-10">
            <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                <Tag className="h-4 w-4 text-emerald-600" />
                {getPostCategory(post)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                {getPostDate(post)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                <Clock3 className="h-4 w-4 text-sky-600" />
                {getReadingTime(post)}
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">{title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{getPostExcerpt(post)}</p>
          </header>

          <img src={post.image || fallbackBlogImage} alt={title} className="mt-10 h-[420px] w-full rounded-2xl object-cover shadow-xl shadow-slate-900/10" />

          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">What you will learn</h2>
            <ul className="mt-5 grid gap-3 text-sm font-semibold leading-7 text-slate-600 sm:grid-cols-2">
              <li className="rounded-xl bg-slate-50 p-4">How this topic improves digital restaurant operations.</li>
              <li className="rounded-xl bg-slate-50 p-4">How QR Restro Nepal supports the workflow from CMS and dashboards.</li>
              <li className="rounded-xl bg-slate-50 p-4">What restaurant owners and platform admins should manage first.</li>
              <li className="rounded-xl bg-slate-50 p-4">How to use content, timing, and headings for search-friendly pages.</li>
            </ul>
          </section>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">Overview</h2>
            <p className="mt-4 text-base leading-8 text-slate-700">{post.metaDescription || paragraphs[0] || 'This article is managed from the platform CMS.'}</p>

            <h2 className="mt-10 text-2xl font-black text-slate-950">Complete guide</h2>
            <div className="mt-4 space-y-5 text-base leading-8 text-slate-700">
              {(paragraphs.length ? paragraphs : [getPostExcerpt(post)]).map((paragraph, index) => (
                <p key={`${paragraph}-${index}`}>{paragraph}</p>
              ))}
            </div>

            <h2 className="mt-10 text-2xl font-black text-slate-950">Next action</h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              Update this article from Platform Admin CMS with a clear title, meta description, image, and body content. The public blog card and article page will refresh automatically.
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}

export default BlogDetail
