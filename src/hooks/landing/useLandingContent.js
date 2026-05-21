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
import { parseOfferBannerContent } from '../../config/cmsTypeConfig'

const matchesKey = (entry, needle) => String(entry?.key || '').toLowerCase().includes(needle)
const matchesAnyKey = (entry, needles) => needles.some((needle) => matchesKey(entry, needle))

const firstParagraph = (value) => String(value || '').split('\n').filter(Boolean)[0]
const splitPhrases = (value) =>
  String(value || '')
    .split(/[|\n,]/)
    .flatMap((item) => {
      const phrase = item.trim()
      return phrase ? [phrase] : []
    })

const defaultHeroBullets = [
  'QR Menu Ordering',
  'Live Kitchen Workflow',
  'Fast Cashier Billing',
  'Restaurant Admin Dashboard',
]

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
  const [siteConfig, setSiteConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        if (cancelled) return
        const [cmsRes, cfgRes] = await Promise.all([
          api.get('/platform/cms', { params: { isActive: true }, skipErrorToast: true }).catch(() => ({ data: { data: [] } })),
          api.get('/customer/landing/site-config', { skipErrorToast: true }).catch(() => ({ data: { data: null } })),
        ])
        if (cancelled) return
        setEntries(cmsRes.data?.data || [])
        setSiteConfig(cfgRes.data?.data || null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
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

    const cmsHero = banner
      ? {
          eyebrow: banner.metaTitle || fallbackHero.eyebrow,
          title: banner.title || fallbackHero.title,
          description: banner.metaDescription || firstParagraph(banner.content) || fallbackHero.description,
          image: banner.image || fallbackHero.image,
          typewriterPhrases: heroTypewriterPhrases.length
            ? heroTypewriterPhrases
            : bannerPhrases.length > 1
              ? bannerPhrases
              : fallbackHero.typewriterPhrases,
        }
      : {
          ...fallbackHero,
          typewriterPhrases: heroTypewriterPhrases.length
            ? heroTypewriterPhrases
            : bannerPhrases.length > 1
              ? bannerPhrases
              : fallbackHero.typewriterPhrases,
        }

    const ah = siteConfig?.hero || {}
    const softwareName = siteConfig?.softwareName || 'QR Restro Nepal'
    const adminPhrases = splitPhrases(ah.typewriterPhrases)
    const typewriterPhrases = adminPhrases.length ? adminPhrases : cmsHero.typewriterPhrases

    const defaultSub = `${softwareName} helps restaurants serve faster, reduce staff confusion, and deliver a cleaner guest experience without extra apps or complicated systems.`

    const bulletLines = String(ah.bulletPoints || '')
      .split('\n')
      .flatMap((line) => {
        const bullet = line.trim()
        return bullet ? [bullet] : []
      })
    const bullets = bulletLines.length ? bulletLines.slice(0, 4) : defaultHeroBullets

    const hero = {
      eyebrow: ah.eyebrow?.trim() || cmsHero.eyebrow,
      title: ah.title?.trim() || cmsHero.title,
      description: ah.description?.trim() || cmsHero.description,
      subDescription: ah.subDescription?.trim() || defaultSub,
      image: ah.image?.trim() || cmsHero.image,
      typewriterPhrases,
      primaryCta: {
        text: ah.primaryCtaText?.trim() || 'Start Free Restaurant Setup',
        href: ah.primaryCtaHref?.trim() || '/vendor/register',
      },
      secondaryCta: {
        text: ah.secondaryCtaText?.trim() || 'Explore Features',
        href: ah.secondaryCtaHref?.trim() || '#features',
      },
      bullets,
    }

    const branding = {
      softwareName,
      brandSubtitle: siteConfig?.brandSubtitle ?? 'Nepal',
      publicSiteUrl: siteConfig?.publicSiteUrl || '',
      supportEmail: siteConfig?.supportEmail || '',
      contactPhone: siteConfig?.contactPhone || '',
      landingTheme: siteConfig?.landingTheme || 'default',
    }

    const footer = {
      tagline:
        siteConfig?.footer?.tagline?.trim() ||
        'Modern QR menu and restaurant management platform for restaurants, cafes, hotels, and food businesses across Nepal.',
      ctaTitle: siteConfig?.footer?.ctaTitle?.trim() || 'Ready to Modernize Your Restaurant?',
      ctaSubtitle:
        siteConfig?.footer?.ctaSubtitle?.trim() ||
        'Launch your restaurant with QR menus, live kitchen sync, digital billing, and a complete restaurant dashboard in minutes.',
    }

    const chat = siteConfig?.chat || {
      enabled: true,
      mode: 'whatsapp',
      whatsappNumber: '9779800000000',
      whatsappMessage: 'Hi, I want to know more about the platform.',
      displayPhone: '',
    }

    return {
      loading,
      branding,
      footer,
      chat,
      hero,
      offerBanner: offerBanner
        ? (() => {
            const parsed = parseOfferBannerContent(offerBanner.content)
            return {
              eyebrow: offerBanner.metaTitle || 'Launch offer',
              title: offerBanner.title || 'First 10 restaurants get 1 month free.',
              description:
                offerBanner.metaDescription ||
                'Register early and start with zero platform cost for the first month.',
              image:
                offerBanner.image ||
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
              ctaLabel: parsed.ctaLabel,
              bullets: parsed.bullets.length
                ? parsed.bullets
                : [
                    'Free restaurant onboarding',
                    'QR menu setup included',
                    'Dashboard access included',
                    'No hidden setup charges',
                  ],
              badgeTitle: parsed.badgeTitle,
              badgeSubtitle: parsed.badgeSubtitle,
            }
          })()
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
  }, [entries, siteConfig, loading])
}
