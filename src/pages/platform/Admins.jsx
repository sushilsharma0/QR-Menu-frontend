import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'

const Admins = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/platform/admins')
      setAdmins(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await api.put(`/platform/admins/${editing._id}`, data)
        toast.success('Admin updated')
      } else {
        await api.post('/platform/admins', data)
        toast.success('Admin created')
      }
      setModalOpen(false)
      reset()
      setEditing(null)
      fetchAdmins()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleEdit = (admin) => {
    setEditing(admin)
    setValue('name', admin.name)
    setValue('email', admin.email)
    setValue('permissions', admin.permissions)
    setModalOpen(true)
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/platform/admins/${id}/toggle-status`)
      toast.success(`Admin ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchAdmins()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Status', accessor: 'isActive', render: (row) => row.isActive ? 'Active' : 'Inactive' },
    { header: 'Actions', accessor: '_id', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">Edit</button>
        <button onClick={() => handleToggleStatus(row._id, row.isActive)} className="text-yellow-600 hover:text-yellow-800">
          {row.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    ) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Management</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage platform administrators</p>
        </div>
        <Button onClick={() => { setEditing(null); reset(); setModalOpen(true); }}>Add Admin</Button>
      </div>

      <Card>
        <Table columns={columns} data={admins} loading={loading} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); reset(); }} title={editing ? 'Edit Admin' : 'Create Admin'}>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
          {!editing && <Input label="Password" type="password" {...register('password', { required: 'Password is required', minLength: 8 })} error={errors.password?.message} />}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2"><input type="checkbox" {...register('permissions.manageRestaurants')} /> Manage Restaurants</label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('permissions.manageSubscriptions')} /> Manage Subscriptions</label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('permissions.manageCMS')} /> Manage CMS</label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('permissions.verifyKYC')} /> Verify KYC</label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('permissions.viewAnalytics')} /> View Analytics</label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); reset(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Admins