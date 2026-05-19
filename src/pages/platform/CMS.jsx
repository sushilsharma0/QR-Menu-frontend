import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiEdit2, FiFileText, FiGlobe, FiLayout, FiTrash2 } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import Table from '../../components/common/Table'
import CmsContentForm from '../../components/platform/CmsContentForm'
import PublicSiteSettingsForm from '../../components/platform/PublicSiteSettingsForm'
import { PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'
import { CMS_CONTENT_GUIDE, CMS_TYPES } from '../../config/cmsTypeConfig'

const CMS = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [filterType, setFilterType] = useState('all')

  const tabFromUrl = searchParams.get('tab')
  const defaultTab = ['blocks', 'public', 'guide'].includes(tabFromUrl) ? tabFromUrl : 'blocks'

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      const res = await api.get('/platform/cms')
      setContents(res.data.data)
    } catch {
      toast.error('Failed to fetch CMS content')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await api.put(`/platform/cms/${editing.key}`, { ...data, key: editing.key })
        toast.success('Content updated')
      } else {
        await api.post('/platform/cms', data)
        toast.success('Content created')
      }
      setEditing(null)
      fetchContents()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleEdit = (content) => {
    setEditing(content)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete content "${key}"?`)) return
    try {
      await api.delete(`/platform/cms/${key}`)
      toast.success('Content deleted')
      if (editing?.key === key) setEditing(null)
      fetchContents()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filteredContents = useMemo(() => {
    if (filterType === 'all') return contents
    return contents.filter((item) => item.type === filterType)
  }, [contents, filterType])

  const columns = [
    { header: 'Key', accessor: 'key' },
    { header: 'Title', accessor: 'title' },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className="capitalize">{CMS_TYPES.find((t) => t.value === row.type)?.label || row.type}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <PlatformPill className={row.isActive ? platformStatusStyles.active : platformStatusStyles.inactive}>
          {row.isActive ? 'Published' : 'Draft'}
        </PlatformPill>
      ),
    },
    {
      header: 'Order',
      accessor: 'sortOrder',
      render: (row) => row.sortOrder ?? 0,
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.key)}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const activeContent = contents.filter((item) => item.isActive).length

  const handleTabChange = (key) => {
    setSearchParams({ tab: key }, { replace: true })
  }

  const blocksTab = (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CMS_TYPES.map((t) => {
          const count = contents.filter((c) => c.type === t.value).length
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilterType(t.value)}
              className={`rounded-xl border p-4 text-left transition ${
                filterType === t.value
                  ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-950/40'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t.label}</p>
              <p className="mt-1 text-xs text-gray-500">{count} entries</p>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`rounded-xl border p-4 text-left transition ${
            filterType === 'all'
              ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-950/40'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'
          }`}
        >
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">All types</p>
          <p className="mt-1 text-xs text-gray-500">{contents.length} entries</p>
        </button>
      </div>

      <Card title={editing ? `Edit: ${editing.key}` : 'Create content'}>
        <CmsContentForm
          key={editing?.key || 'new'}
          editing={editing}
          onSubmit={onSubmit}
          onCancel={() => setEditing(null)}
        />
      </Card>

      <Card title="Content library">
        <Table columns={columns} data={filteredContents} loading={loading} />
      </Card>
    </div>
  )

  const guideTab = (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-sm font-bold text-amber-950 dark:text-amber-100">Restaurant offer banner — recommended copy</p>
        <ul className="mt-3 space-y-2 text-sm text-amber-900/90 dark:text-amber-100/90">
          <li>
            <strong>Key:</strong> offer_first_10 (must include offer, promo, deal, or free)
          </li>
          <li>
            <strong>Eyebrow:</strong> Limited launch offer · Nepal
          </li>
          <li>
            <strong>Headline:</strong> First 10 restaurants get 1 month free
          </li>
          <li>
            <strong>Description:</strong> Zero platform fee for month one. Priority onboarding and QR setup help included.
          </li>
          <li>
            <strong>Extra content:</strong> first line = button label; next lines = bullets (e.g. Free onboarding, QR menu included)
          </li>
          <li>
            <strong>Image:</strong> warm restaurant interior or guests dining — 1200×800, high quality
          </li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CMS_CONTENT_GUIDE.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-xs font-black uppercase tracking-wide text-primary-600 dark:text-primary-400">
              {item.type}
            </p>
            <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
            <p className="mt-1 text-xs text-gray-500">Suggested key: {item.key}</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {item.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )

  const cmsTabs = [
    { key: 'blocks', label: 'Content blocks', content: blocksTab },
    { key: 'public', label: 'Public site', content: <PublicSiteSettingsForm /> },
    { key: 'guide', label: 'Guide & ideas', content: guideTab },
  ]

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Marketing"
        title="Website & landing content"
        description="Manage landing page blocks, restaurant offer banners, blog posts, and global public site branding in one place."
        icon={FiLayout}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Content blocks" value={contents.length} sub="CMS entries" icon={FiFileText} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Published" value={activeContent} sub={`${contents.length - activeContent} drafts`} icon={FiLayout} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Public site" value="Live" sub="Branding & hero overrides" icon={FiGlobe} accent="from-amber-500 to-orange-500" />
      </div>

      <Card title="Landing page manager">
        <Tabs tabs={cmsTabs} defaultTab={defaultTab} onChange={handleTabChange} />
      </Card>
    </div>
  )
}

export default CMS
