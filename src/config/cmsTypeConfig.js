/** CMS content types â€” field labels and help match landing page usage. */

export const CMS_TYPES = [
  { value: 'banner', label: 'Banner', description: 'Hero image strip or promotional offer on the landing page.' },
  { value: 'feature', label: 'Feature card', description: 'Icon cards in the Features section (sort order = display order).' },
  { value: 'blog', label: 'Blog post', description: 'Articles on the landing blog preview and blog page.' },
  { value: 'page', label: 'Page block', description: 'About section, stats, or other static blocks (use key with "about" or "best").' },
  { value: 'faq', label: 'FAQ', description: 'Question and answer pairs (for future FAQ sections).' },
]

export const CMS_TYPE_BY_VALUE = Object.fromEntries(CMS_TYPES.map((t) => [t.value, t]))

/** Suggested keys when creating new content (admin picks or edits). */
export const CMS_KEY_PRESETS = {
  banner: [
    { key: 'hero_main', label: 'Main hero (no "offer" in key)' },
    { key: 'offer_first_10', label: 'Restaurant offer (key must include offer/promo/deal/free)' },
  ],
  feature: [{ key: 'feature_qr_menu', label: 'Example: feature_qr_menu' }],
  blog: [{ key: 'blog_how_qr_menu_works', label: 'Example: blog_how_qr_menu_works' }],
  page: [
    { key: 'about_platform', label: 'About section (key contains "about")' },
    { key: 'best_stat_primary', label: 'Best things stat (key contains "best")' },
  ],
  faq: [{ key: 'faq_setup_time', label: 'Example: faq_setup_time' }],
}

/**
 * Per-type field config: which form fields to show and how to label them.
 * name = react-hook-form field name
 */
export function getCmsFieldsForType(type) {
  const common = {
    key: {
      show: true,
      label: 'Unique key',
      help: 'Lowercase with underscores. Cannot change after save. Landing logic uses key words (e.g. offer, about).',
      placeholder: 'offer_first_10',
      required: true,
    },
    title: { show: true, label: 'Title', help: '', placeholder: '' },
    isActive: { show: true },
    sortOrder: { show: true, label: 'Sort order', help: 'Lower numbers appear first.' },
  }

  switch (type) {
    case 'banner':
      return {
        ...common,
        key: {
          ...common.key,
          help: 'Hero: avoid words offer/promo/deal/free. Offer banner: include one of those words (e.g. offer_first_10).',
        },
        title: {
          show: true,
          label: 'Headline',
          help: 'Large text on the banner.',
          placeholder: 'First 10 restaurants get 1 month free',
        },
        metaTitle: {
          show: true,
          label: 'Eyebrow / badge text',
          help: 'Small label above the headline (e.g. "Limited launch offer").',
          placeholder: 'Limited launch offer',
        },
        metaDescription: {
          show: true,
          label: 'Short description',
          help: '1â€“2 sentences under the headline.',
          placeholder: 'Register early and start free for the first month.',
        },
        image: {
          show: true,
          label: 'Image URL',
          help: 'Wide restaurant photo, 1200Ã—800 recommended. HTTPS URL.',
          placeholder: 'https://images.unsplash.com/...',
        },
        content: {
          show: true,
          label: 'Extra content',
          help: 'Offer banner: first line = button label. Next lines = bullet points (one per line). Hero: optional typewriter phrases (one per line).',
          placeholder: 'Claim free month\nFree onboarding\nQR menu setup included',
          rows: 5,
        },
        metaKeywords: { show: false },
      }
    case 'feature':
      return {
        ...common,
        title: {
          show: true,
          label: 'Feature title',
          help: 'Shown on the feature card.',
          placeholder: 'QR Menu for Every Table',
        },
        metaDescription: {
          show: true,
          label: 'Feature description',
          help: 'Short paragraph under the title.',
          placeholder: 'Customers scan and order from their phone.',
        },
        content: { show: false },
        image: { show: false },
        metaTitle: { show: false },
        metaKeywords: { show: false },
      }
    case 'blog':
      return {
        ...common,
        title: {
          show: true,
          label: 'Post title',
          help: 'Shown on cards and post header.',
          placeholder: 'How QR menus reduce wait times',
        },
        metaTitle: {
          show: true,
          label: 'SEO title (optional)',
          help: 'Browser tab / search engines. Defaults to post title if empty.',
          placeholder: 'QR Menu Tips for Restaurants in Nepal',
        },
        metaDescription: {
          show: true,
          label: 'Excerpt / summary',
          help: 'Short preview on landing and blog list (2â€“3 sentences).',
          placeholder: 'Learn how digital menus help during busy hoursâ€¦',
        },
        image: {
          show: true,
          label: 'Cover image URL',
          help: 'Landscape image for the blog card.',
          placeholder: 'https://...',
        },
        content: {
          show: true,
          label: 'Article body',
          help: 'Full post text. Use blank lines between paragraphs.',
          placeholder: 'Restaurants across Nepal are switching to QR orderingâ€¦',
          rows: 10,
        },
        metaKeywords: { show: false },
      }
    case 'page':
      return {
        ...common,
        key: {
          ...common.key,
          help: 'Include "about" for About section or "best" for the stats highlight block.',
        },
        title: {
          show: true,
          label: 'Section heading',
          help: 'Main heading for this block.',
          placeholder: 'Built for modern restaurants in Nepal',
        },
        metaDescription: {
          show: true,
          label: 'Body text (short)',
          help: 'For About: main paragraph. For "best": stat label under the number.',
          placeholder: 'We help restaurants digitize menus, kitchen, and billingâ€¦',
        },
        content: {
          show: true,
          label: 'Extended body (optional)',
          help: 'Extra paragraphs if meta description is not enough.',
          rows: 6,
        },
        image: {
          show: true,
          label: 'Image URL',
          help: 'About section photo. Optional for "best" stats.',
          placeholder: 'https://...',
        },
        metaTitle: { show: false },
        metaKeywords: { show: false },
      }
    case 'faq':
      return {
        ...common,
        title: {
          show: true,
          label: 'Question',
          help: 'The FAQ question visitors will see.',
          placeholder: 'How long does setup take?',
        },
        content: {
          show: true,
          label: 'Answer',
          help: 'Clear answer in plain language.',
          rows: 4,
          placeholder: 'Most restaurants go live within 1â€“2 daysâ€¦',
        },
        metaDescription: { show: false },
        image: { show: false },
        metaTitle: { show: false },
        metaKeywords: { show: false },
      }
    default:
      return {
        ...common,
        metaTitle: { show: true, label: 'Meta title' },
        metaDescription: { show: true, label: 'Meta description' },
        content: { show: true, label: 'Content', rows: 6 },
        image: { show: true, label: 'Image URL' },
      }
  }
}

/** Content ideas for admins â€” shown in guide tab. */
export const CMS_CONTENT_GUIDE = [
  {
    type: 'banner',
    title: 'Hero banner (main)',
    key: 'hero_main',
    tips: [
      'Keep key without offer/promo/deal/free.',
      'Eyebrow: "Digital dining platform Â· Nepal"',
      'Headline: value proposition in one line.',
      'Image: bright restaurant interior or staff with tablet.',
    ],
  },
  {
    type: 'banner',
    title: 'Offer banner (restaurants)',
    key: 'offer_first_10',
    tips: [
      'Key must include offer, promo, deal, or free.',
      'Example headline: "First 10 restaurants get 1 month free"',
      'Line 1 of Extra content = button text (e.g. Claim free month).',
      'Following lines = benefit bullets shown on the offer card.',
      'Image: happy diners or busy restaurant â€” conveys success.',
    ],
  },
  {
    type: 'feature',
    title: 'Feature cards',
    key: 'feature_*',
    tips: [
      'Add 6 cards: QR menu, Menu management, Kitchen, Billing, Wait time, Guest experience.',
      'Sort order 0, 1, 2â€¦ controls left-to-right order on landing.',
    ],
  },
  {
    type: 'blog',
    title: 'Blog posts',
    key: 'blog_*',
    tips: [
      'Topics: QR menu benefits, kitchen workflow, reducing errors, Nepal restaurant trends.',
      'Excerpt = what appears on landing; body = full article.',
      'Active posts with lowest sort order show first (max 3 on landing).',
    ],
  },
  {
    type: 'page',
    title: 'About block',
    key: 'about_platform',
    tips: ['Title + body + team/restaurant photo for trust.'],
  },
]

export function parseOfferBannerContent(content) {
  const raw = String(content || '').trim()
  if (!raw) {
    return { ctaLabel: 'Claim free month', bullets: [], badgeTitle: '1 Month Free', badgeSubtitle: 'Launch offer' }
  }
  const lines = raw.split('\n').flatMap((line) => {
    const trimmed = line.trim()
    return trimmed ? [trimmed] : []
  })
  const first = lines[0] || ''
  let ctaLabel = 'Claim free month'
  let restStart = 0
  if (first.toLowerCase().startsWith('cta:')) {
    ctaLabel = first.slice(4).trim() || ctaLabel
    restStart = 1
  } else if (first.includes('|') && !first.startsWith('-')) {
    const parts = first.split('|').map((p) => p.trim())
    ctaLabel = parts[0] || ctaLabel
    restStart = 1
  } else if (!first.startsWith('-')) {
    ctaLabel = first
    restStart = 1
  }
  const rest = lines.slice(restStart)
  let badgeTitle = '1 Month Free'
  let badgeSubtitle = 'Launch offer'
  const badgeLine = rest.find((l) => l.toLowerCase().startsWith('badge:'))
  const bulletLines = rest.filter((l) => !l.toLowerCase().startsWith('badge:'))
  if (badgeLine) {
    const badgeParts = badgeLine.slice(6).split('|').map((p) => p.trim())
    badgeTitle = badgeParts[0] || badgeTitle
    badgeSubtitle = badgeParts[1] || badgeSubtitle
  }
  const bullets = bulletLines.flatMap((line) => {
    const bullet = line.replace(/^[-•]\s*/, '').trim()
    return bullet ? [bullet] : []
  })
  return {
    ctaLabel,
    bullets,
    badgeTitle,
    badgeSubtitle,
  }
}
