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
const matchesAnyKey = (entry, needles) => needles.some((needle) => matchesKey(entry, needle))

const firstParagraph = (value) => String(value || '').split('\n').filter(Boolean)[0]
const splitPhrases = (value) =>
  String(value || '')
    .split(/[|\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

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
    const activeEntries = entries.filter((entry) => entry.isActive !== false)
    const offerBanner = activeEntries.find((entry) => entry.type === 'banner' && matchesAnyKey(entry, ['offer', 'promo', 'deal', 'free']))
    const banner = activeEntries.find((entry) => entry.type === 'banner' && entry.key !== offerBanner?.key)
    const featureEntries = activeEntries.filter((entry) => entry.type === 'feature')
    const blogEntries = activeEntries.filter((entry) => entry.type === 'blog')
    const aboutEntry = activeEntries.find((entry) => entry.type === 'page' && matchesKey(entry, 'about'))
    const bestEntry = activeEntries.find((entry) => entry.type === 'page' && matchesKey(entry, 'best'))
    const heroTypewriterEntry = activeEntries.find((entry) =>
      entry.type === 'page' && matchesAnyKey(entry, ['hero-typewriter', 'hero_typewriter', 'hero-phrases', 'hero_phrases']),
    )
    const heroTypewriterPhrases = splitPhrases(heroTypewriterEntry?.content || heroTypewriterEntry?.metaDescription)
    const bannerPhrases = splitPhrases(banner?.content)
    const typewriterPhrases = heroTypewriterPhrases.length
      ? heroTypewriterPhrases
      : bannerPhrases.length > 1
        ? bannerPhrases
        : fallbackHero.typewriterPhrases

    return {
      loading,
      hero: banner
        ? {
            eyebrow: banner.metaTitle || fallbackHero.eyebrow,
            title: banner.title || fallbackHero.title,
            description: banner.metaDescription || firstParagraph(banner.content) || fallbackHero.description,
            image: banner.image || fallbackHero.image,
            typewriterPhrases,
          }
        : {
            ...fallbackHero,
            typewriterPhrases,
          },
      offerBanner: offerBanner
        ? {
            eyebrow: offerBanner.metaTitle || 'Launch offer',
            title: offerBanner.title || 'First 10 restaurants get 1 month free.',
            description: offerBanner.metaDescription || firstParagraph(offerBanner.content) || 'Register early and start QR Restro Nepal free for the first month.',
            image: offerBanner.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
            ctaLabel: offerBanner.content?.includes('|') ? offerBanner.content.split('|')[0].trim() : 'Claim free month',
          }
        : null,
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
