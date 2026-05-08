export const fallbackBlogImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200'

export const getPostTitle = (post) => post?.title || post?.metaTitle || post?.key || 'Restaurant guide'

export const getPostExcerpt = (post) => post?.metaDescription || post?.content || 'Read the latest QR restaurant platform update.'

export const getPostCategory = (post) => {
  const key = String(post?.key || '').toLowerCase()
  if (key.includes('seo') || key.includes('cms') || key.includes('website')) return 'Website CMS'
  if (key.includes('qr') || key.includes('menu')) return 'QR Menu'
  if (key.includes('saas') || key.includes('vendor')) return 'Restaurant SaaS'
  return 'Restaurant Growth'
}

export const getReadingTime = (post) => {
  const words = String(`${post?.title || ''} ${post?.metaDescription || ''} ${post?.content || ''}`).trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 180))} min read`
}

export const getPostDate = (post) => {
  if (!post?.updatedAt && !post?.createdAt) return 'Platform update'
  return new Date(post.updatedAt || post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const getPostUrl = (post) => `/blog/${encodeURIComponent(post?.key || post?._id || 'post')}`
