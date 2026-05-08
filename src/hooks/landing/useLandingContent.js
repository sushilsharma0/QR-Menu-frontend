import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import {
  fallbackAbout,
  fallbackBestThings,
  fallbackBlogs,
  fallbackFeatures,
  fallbackHero,
  featureIcons,
} from '../../components/landing/landingDefaults'

const matchesKey = (entry, needle) => String(entry?.key || '').toLowerCase().includes(needle)

const firstParagraph = (value) => String(value || '').split('\n').filter(Boolean)[0]

const mapFeature = (entry, index) => {
  const Icon = featureIcons[index % featureIcons.length]
  return {
    icon: Icon,
    title: entry.title || entry.key,
    text: entry.metaDescription || firstParagraph(entry.content) || 'Managed from platform CMS.',
  }
}

export const useLandingContent = () => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.get('/platform/cms', {
          params: { isActive: true },
          skipErrorToast: true,
        })
        setEntries(response.data?.data || [])
      } catch (error) {
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  return useMemo(() => {
    const banner = entries.find((entry) => entry.type === 'banner')
    const featureEntries = entries.filter((entry) => entry.type === 'feature')
    const blogEntries = entries.filter((entry) => entry.type === 'blog')
    const aboutEntry = entries.find((entry) => entry.type === 'page' && matchesKey(entry, 'about'))
    const bestEntry = entries.find((entry) => entry.type === 'page' && matchesKey(entry, 'best'))

    return {
      loading,
      hero: banner
        ? {
            eyebrow: banner.metaTitle || fallbackHero.eyebrow,
            title: banner.title || fallbackHero.title,
            description: banner.metaDescription || firstParagraph(banner.content) || fallbackHero.description,
            image: banner.image || fallbackHero.image,
          }
        : fallbackHero,
      features: featureEntries.length ? featureEntries.map(mapFeature) : fallbackFeatures,
      bestThings: bestEntry
        ? [
            {
              icon: fallbackBestThings[0].icon,
              value: bestEntry.title || fallbackBestThings[0].value,
              label: bestEntry.metaDescription || firstParagraph(bestEntry.content) || fallbackBestThings[0].label,
            },
            ...fallbackBestThings.slice(1),
          ]
        : fallbackBestThings,
      about: aboutEntry
        ? {
            title: aboutEntry.title || fallbackAbout.title,
            description: aboutEntry.metaDescription || aboutEntry.content || fallbackAbout.description,
            image: aboutEntry.image || fallbackAbout.image,
          }
        : fallbackAbout,
      blogs: blogEntries.length ? blogEntries.slice(0, 3) : fallbackBlogs,
    }
  }, [entries, loading])
}
