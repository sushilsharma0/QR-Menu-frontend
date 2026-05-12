import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiAward,
  FiHeart,
  FiImage,
  FiInfo,
  FiPlus,
  FiShield,
  FiStar,
  FiTrash2,
} from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const FEATURE_ICON_OPTIONS = [
  { value: 'Utensils', label: 'Utensils' },
  { value: 'Award', label: 'Award' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Star', label: 'Star' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Leaf', label: 'Leaf' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Smile', label: 'Smile' },
  { value: 'ThumbsUp', label: 'Thumbs Up' },
  { value: 'Truck', label: 'Truck' },
]

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const DEFAULT_PRIVACY_SECTIONS = [
  {
    title: 'Introduction',
    content:
      'Welcome to our restaurant. This privacy policy explains how we collect, use, and protect your information when you order through our QR menu.',
  },
  {
    title: 'Information We Collect',
    content:
      'When you place an order we collect your name, contact details, table number, and ordering preferences so we can fulfil your order.',
  },
  {
    title: 'How We Use Your Information',
    content: 'We use your information to process orders, personalise the menu, and contact you about your visit.',
  },
  {
    title: 'Contact Us',
    content: 'For any privacy related questions, please reach out using the contact details below.',
  },
]

const emptyAbout = () => ({
  tagline: '',
  aboutText: '',
  cuisine: '',
  priceRange: '',
  establishedYear: '',
  rating: '',
  reviewCount: '',
  features: [],
  gallery: [],
  hours: DAYS.reduce((acc, d) => ({ ...acc, [d.key]: '' }), {}),
  socials: { website: '', facebook: '', instagram: '', twitter: '' },
})

const emptyPrivacy = () => ({
  enabled: false,
  sections: [],
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  lastUpdated: null,
})

export default function PublicProfile() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [about, setAbout] = useState(emptyAbout())
  const [privacy, setPrivacy] = useState(emptyPrivacy())
  const [galleryDraft, setGalleryDraft] = useState('')
  const [featureDraft, setFeatureDraft] = useState({ icon: 'Utensils', label: '' })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/auth/profile')
      const data = res.data?.data || {}
      setRestaurant(data)
      const a = data.about || {}
      const p = data.privacyPolicy || {}
      setAbout({
        tagline: a.tagline || '',
        aboutText: a.aboutText || '',
        cuisine: a.cuisine || '',
        priceRange: a.priceRange || '',
        establishedYear: a.establishedYear ?? '',
        rating: a.rating ?? '',
        reviewCount: a.reviewCount ?? '',
        features: Array.isArray(a.features) ? a.features : [],
        gallery: Array.isArray(a.gallery) ? a.gallery : [],
        hours: {
          monday: a.hours?.monday || '',
          tuesday: a.hours?.tuesday || '',
          wednesday: a.hours?.wednesday || '',
          thursday: a.hours?.thursday || '',
          friday: a.hours?.friday || '',
          saturday: a.hours?.saturday || '',
          sunday: a.hours?.sunday || '',
        },
        socials: {
          website: a.socials?.website || '',
          facebook: a.socials?.facebook || '',
          instagram: a.socials?.instagram || '',
          twitter: a.socials?.twitter || '',
        },
      })
      setPrivacy({
        enabled: p.enabled === true,
        sections: Array.isArray(p.sections) ? p.sections : [],
        contactEmail: p.contactEmail || data.email || '',
        contactPhone: p.contactPhone || data.phone || '',
        contactAddress: p.contactAddress || data.address || '',
        lastUpdated: p.lastUpdated || null,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load restaurant profile')
    } finally {
      setLoading(false)
    }
  }

  const updateAbout = (patch) => setAbout((prev) => ({ ...prev, ...patch }))
  const updateAboutHours = (day, value) =>
    setAbout((prev) => ({ ...prev, hours: { ...prev.hours, [day]: value } }))
  const updateAboutSocial = (key, value) =>
    setAbout((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }))

  const addGalleryImage = () => {
    const url = galleryDraft.trim()
    if (!url) return
    if (about.gallery.length >= 12) {
      toast.error('Gallery is limited to 12 photos')
      return
    }
    setAbout((prev) => ({ ...prev, gallery: [...prev.gallery, url] }))
    setGalleryDraft('')
  }

  const removeGalleryImage = (idx) => {
    setAbout((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))
  }

  const addFeature = () => {
    const label = featureDraft.label.trim()
    if (!label) return
    if (about.features.length >= 8) {
      toast.error('You can showcase up to 8 features')
      return
    }
    setAbout((prev) => ({
      ...prev,
      features: [...prev.features, { icon: featureDraft.icon || 'Utensils', label }],
    }))
    setFeatureDraft({ icon: 'Utensils', label: '' })
  }

  const removeFeature = (idx) => {
    setAbout((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }))
  }

  const updatePrivacySection = (idx, patch) => {
    setPrivacy((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }))
  }

  const addPrivacySection = () => {
    if (privacy.sections.length >= 30) {
      toast.error('You can add up to 30 sections')
      return
    }
    setPrivacy((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: 'New section', content: '' }],
    }))
  }

  const removePrivacySection = (idx) => {
    setPrivacy((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }))
  }

  const movePrivacySection = (idx, direction) => {
    setPrivacy((prev) => {
      const next = [...prev.sections]
      const target = idx + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...prev, sections: next }
    })
  }

  const seedDefaultPrivacy = () => {
    setPrivacy((prev) => ({
      ...prev,
      enabled: true,
      sections: prev.sections.length > 0 ? prev.sections : DEFAULT_PRIVACY_SECTIONS.map((s) => ({ ...s })),
      contactEmail: prev.contactEmail || restaurant?.email || '',
      contactPhone: prev.contactPhone || restaurant?.phone || '',
      contactAddress: prev.contactAddress || restaurant?.address || '',
    }))
    toast.success('Loaded a starter privacy policy — edit to match your restaurant')
  }

  const onSubmit = async (e) => {
    e?.preventDefault?.()
    try {
      setSaving(true)
      const formData = new FormData()
      formData.append(
        'about',
        JSON.stringify({
          ...about,
          establishedYear: about.establishedYear === '' ? undefined : Number(about.establishedYear),
          rating: about.rating === '' ? undefined : Number(about.rating),
          reviewCount: about.reviewCount === '' ? undefined : Number(about.reviewCount),
        }),
      )
      formData.append(
        'privacyPolicy',
        JSON.stringify({
          enabled: privacy.enabled,
          sections: privacy.sections.filter((s) => s.title.trim()),
          contactEmail: privacy.contactEmail,
          contactPhone: privacy.contactPhone,
          contactAddress: privacy.contactAddress,
        }),
      )
      await api.put('/restaurant/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Public profile saved — customers see the changes instantly')
      await fetchProfile()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to save public profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Public profile &amp; policies</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Everything here is rendered on the customer QR portal — the &ldquo;About&rdquo; page and the &ldquo;Privacy Policy&rdquo; page.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card title="About — hero" icon={FiInfo}>
          <div className="space-y-4">
            <Input
              label="Tagline"
              placeholder="Delicious food, served with love"
              value={about.tagline}
              onChange={(e) => updateAbout({ tagline: e.target.value })}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                About description
              </label>
              <textarea
                rows={5}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Tell guests what makes your restaurant special — cuisine, story, ingredients, vibe…"
                value={about.aboutText}
                onChange={(e) => updateAbout({ aboutText: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Cuisine"
                placeholder="Multi-cuisine, Nepali, Indo-Chinese…"
                value={about.cuisine}
                onChange={(e) => updateAbout({ cuisine: e.target.value })}
              />
              <Input
                label="Price range"
                placeholder="Rs. 200 – Rs. 1500"
                value={about.priceRange}
                onChange={(e) => updateAbout({ priceRange: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Established (year)"
                type="number"
                placeholder="2018"
                value={about.establishedYear}
                onChange={(e) => updateAbout({ establishedYear: e.target.value })}
              />
              <Input
                label="Rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="4.8"
                value={about.rating}
                onChange={(e) => updateAbout({ rating: e.target.value })}
              />
              <Input
                label="Review count"
                type="number"
                min="0"
                placeholder="234"
                value={about.reviewCount}
                onChange={(e) => updateAbout({ reviewCount: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card title="Highlight features" icon={FiAward}>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Up to 8 quick badges that appear under your About description (e.g. &ldquo;Fresh ingredients&rdquo;,
            &ldquo;Best service&rdquo;).
          </p>
          <div className="space-y-3">
            {about.features.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                No highlight features yet. Add a few below to make your About section pop.
              </p>
            )}
            {about.features.map((feature, idx) => (
              <div
                key={`${feature.label}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                  <FiStar className="h-4 w-4" />
                </span>
                <div className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                  {feature.label}
                </div>
                <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                  {feature.icon}
                </span>
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  aria-label="Remove feature"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <select
              value={featureDraft.icon}
              onChange={(e) => setFeatureDraft((prev) => ({ ...prev, icon: e.target.value }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {FEATURE_ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Input
              placeholder="Feature label"
              value={featureDraft.label}
              onChange={(e) => setFeatureDraft((prev) => ({ ...prev, label: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addFeature()
                }
              }}
            />
            <Button type="button" onClick={addFeature}>
              <FiPlus className="mr-2 h-4 w-4" /> Add feature
            </Button>
          </div>
        </Card>

        <Card title="Opening hours" icon={FiHeart}>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Per-day hours shown on the customer About page (leave blank to inherit your global Opening/Closing time).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {DAYS.map((day) => (
              <div key={day.key}>
                <Input
                  label={day.label}
                  placeholder="9:00 AM - 10:00 PM"
                  value={about.hours[day.key]}
                  onChange={(e) => updateAboutHours(day.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Photo gallery" icon={FiImage}>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Paste image URLs (one at a time) to showcase your restaurant in the About gallery. Up to 12 images.
          </p>
          {about.gallery.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {about.gallery.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <img src={url} alt="Gallery" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute right-2 top-2 hidden rounded-lg bg-red-500 p-1.5 text-white group-hover:flex"
                    aria-label="Remove image"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="https://example.com/photo.jpg"
              value={galleryDraft}
              onChange={(e) => setGalleryDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addGalleryImage()
                }
              }}
            />
            <Button type="button" onClick={addGalleryImage}>
              <FiPlus className="mr-2 h-4 w-4" /> Add photo
            </Button>
          </div>
        </Card>

        <Card title="Social links">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Website"
              placeholder="https://yourrestaurant.com"
              value={about.socials.website}
              onChange={(e) => updateAboutSocial('website', e.target.value)}
            />
            <Input
              label="Facebook"
              placeholder="https://facebook.com/yourpage"
              value={about.socials.facebook}
              onChange={(e) => updateAboutSocial('facebook', e.target.value)}
            />
            <Input
              label="Instagram"
              placeholder="https://instagram.com/yourpage"
              value={about.socials.instagram}
              onChange={(e) => updateAboutSocial('instagram', e.target.value)}
            />
            <Input
              label="Twitter / X"
              placeholder="https://x.com/yourpage"
              value={about.socials.twitter}
              onChange={(e) => updateAboutSocial('twitter', e.target.value)}
            />
          </div>
        </Card>

        <Card
          title="Privacy policy"
          icon={FiShield}
          actions={
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={privacy.enabled}
                  onChange={(e) => setPrivacy((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Publish to customers
              </label>
            </div>
          }
        >
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Add the privacy sections you want customers to see. They render on the &ldquo;Privacy Policy&rdquo;
            page accessed from the customer side menu.
            {privacy.lastUpdated && (
              <span className="ml-1">
                Last updated:{' '}
                <span className="font-semibold">
                  {new Date(privacy.lastUpdated).toLocaleString()}
                </span>
              </span>
            )}
          </p>

          {privacy.sections.length === 0 && (
            <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <p>No privacy sections yet.</p>
              <button
                type="button"
                onClick={seedDefaultPrivacy}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                Load starter template
              </button>
            </div>
          )}

          <div className="space-y-3">
            {privacy.sections.map((section, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-3 flex items-start gap-3">
                  <Input
                    label={`Section ${idx + 1} title`}
                    value={section.title}
                    onChange={(e) => updatePrivacySection(idx, { title: e.target.value })}
                  />
                  <div className="flex flex-col items-center pt-6">
                    <button
                      type="button"
                      onClick={() => movePrivacySection(idx, -1)}
                      disabled={idx === 0}
                      className="rounded-md px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => movePrivacySection(idx, 1)}
                      disabled={idx === privacy.sections.length - 1}
                      className="rounded-md px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePrivacySection(idx)}
                    className="mt-7 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    aria-label="Remove section"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Explain this part of your privacy policy in plain English."
                  value={section.content}
                  onChange={(e) => updatePrivacySection(idx, { content: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={addPrivacySection}>
              <FiPlus className="mr-2 h-4 w-4" /> Add section
            </Button>
            {privacy.sections.length === 0 && (
              <Button type="button" variant="ghost" onClick={seedDefaultPrivacy}>
                Use starter template
              </Button>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact email"
              placeholder="privacy@yourrestaurant.com"
              value={privacy.contactEmail}
              onChange={(e) => setPrivacy((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
            <Input
              label="Contact phone"
              placeholder="+977 98XXXXXXXX"
              value={privacy.contactPhone}
              onChange={(e) => setPrivacy((prev) => ({ ...prev, contactPhone: e.target.value }))}
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact address
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Your restaurant address for privacy enquiries"
                value={privacy.contactAddress}
                onChange={(e) => setPrivacy((prev) => ({ ...prev, contactAddress: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={fetchProfile} disabled={loading || saving}>
            Discard changes
          </Button>
        </div>
      </form>
    </div>
  )
}
