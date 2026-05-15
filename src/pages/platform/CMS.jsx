import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FiEdit2, FiFileText, FiLayout, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import { PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

const CMS = () => {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      type: 'page',
      isActive: true,
      sortOrder: 0,
    },
  })

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      const res = await api.get('/platform/cms')
      setContents(res.data.data)
    } catch (error) {
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
      reset()
      setEditing(null)
      fetchContents()
    } catch (error) {
      toast.error('Operation failed')
    }
  }

  const handleEdit = (content) => {
    setEditing(content)
    setValue('key', content.key)
    setValue('title', content.title)
    setValue('content', content.content)
    setValue('type', content.type)
    setValue('isActive', content.isActive)
    setValue('metaTitle', content.metaTitle)
    setValue('metaDescription', content.metaDescription)
    setValue('image', content.image)
    setValue('sortOrder', content.sortOrder)
  }

  const handleDelete = async (key) => {
    try {
      await api.delete(`/platform/cms/${key}`)
      toast.success('Content deleted')
      fetchContents()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const columns = [
    { header: 'Key', accessor: 'key' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'type', render: (row) => <span className="capitalize">{row.type}</span> },
    { header: 'Status', accessor: 'isActive', render: (row) => (
      <PlatformPill className={row.isActive ? platformStatusStyles.active : platformStatusStyles.inactive}>
        {row.isActive ? 'Active' : 'Inactive'}
      </PlatformPill>
    ) },
    { header: 'Actions', accessor: '_id', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row)} className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600" title="Edit content">
          <FiEdit2 className="h-4 w-4" />
        </button>
        <button onClick={() => handleDelete(row.key)} className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600" title="Delete content">
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    ) },
  ]

  const activeContent = contents.filter((item) => item.isActive).length

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Website Content"
        title="Content Management"
        description="Create, update, and publish CMS entries used across platform-facing website surfaces."
        icon={FiLayout}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Content blocks" value={contents.length} sub="Total CMS entries" icon={FiFileText} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Active" value={activeContent} sub={`${contents.length - activeContent} inactive`} icon={FiLayout} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Types" value={new Set(contents.map((item) => item.type)).size} sub="Distinct content formats" icon={FiPlus} accent="from-amber-500 to-orange-500" />
      </div>

      <Card title="Landing Page CMS Map">
        <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-bold text-gray-900 dark:text-gray-100">Hero banner</p>
            <p className="mt-1">Create an active Banner. Avoid offer words in the key. Title, summary, and image become the landing hero.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-bold text-gray-900 dark:text-gray-100">Offer banner</p>
            <p className="mt-1">Create an active Banner with key like offer_first_10. Title, summary, and image show as the animated front offer.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-bold text-gray-900 dark:text-gray-100">Features</p>
            <p className="mt-1">Create active Feature entries. Sort order controls the feature card order.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-bold text-gray-900 dark:text-gray-100">About</p>
            <p className="mt-1">Create a Page with key containing "about". Add image for the about photo.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-bold text-gray-900 dark:text-gray-100">Blog</p>
            <p className="mt-1">Create active Blog entries. They appear on the landing page and blog page.</p>
          </div>
        </div>
      </Card>

      <Card title={editing ? 'Edit Content' : 'Create New Content'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Key"
            placeholder="unique_key_name"
            {...register('key', { required: 'Key is required' })}
            error={errors.key?.message}
            readOnly={!!editing}
          />
          <Input label="Title" {...register('title')} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Meta Title" placeholder="SEO or blog headline" {...register('metaTitle')} />
            <Input label="Image URL" placeholder="https://..." {...register('image')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Meta Description / Blog Summary</label>
            <textarea rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" {...register('metaDescription')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Content / Blog Body</label>
            <textarea rows={6} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" {...register('content')} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select {...register('type')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              <option value="page">Page</option>
              <option value="banner">Banner</option>
              <option value="faq">FAQ</option>
              <option value="feature">Feature</option>
              <option value="blog">Blog</option>
            </select>
            </div>
            <Input label="Sort Order" type="number" {...register('sortOrder', { valueAsNumber: true })} />
          </div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('isActive')} />
            <span>Active</span>
          </label>
          <div className="flex gap-3">
            <Button type="submit"><FiPlus className="mr-2" />{editing ? 'Update' : 'Create'}</Button>
            {editing && <Button type="button" variant="secondary" onClick={() => { reset(); setEditing(null); }}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card title="All Content">
        <Table columns={columns} data={contents} loading={loading} />
      </Card>
    </div>
  )
}

export default CMS
