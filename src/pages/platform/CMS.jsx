import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'

const CMS = () => {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm()

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
        await api.put(`/platform/cms/${editing.key}`, data)
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
    { header: 'Type', accessor: 'type' },
    { header: 'Status', accessor: 'isActive', render: (row) => row.isActive ? 'Active' : 'Inactive' },
    { header: 'Actions', accessor: '_id', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">Edit</button>
        <button onClick={() => handleDelete(row.key)} className="text-red-600 hover:text-red-800">Delete</button>
      </div>
    ) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-500 mt-1">Manage website content</p>
      </div>

      <Card title={editing ? 'Edit Content' : 'Create New Content'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Key"
            placeholder="unique_key_name"
            {...register('key', { required: 'Key is required' })}
            error={errors.key?.message}
            disabled={!!editing}
          />
          <Input label="Title" {...register('title')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg" {...register('content')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select {...register('type')} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="page">Page</option>
              <option value="banner">Banner</option>
              <option value="faq">FAQ</option>
              <option value="feature">Feature</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} />
            <span>Active</span>
          </label>
          <div className="flex gap-3">
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
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