import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FiEdit2, FiShield, FiUserCheck, FiUserPlus, FiUserX, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import { PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

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
    { header: 'Admin', accessor: 'name', render: (row) => (
      <div>
        <p className="font-semibold text-gray-950 dark:text-gray-100">{row.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
      </div>
    ) },
    { header: 'Role', accessor: 'role', render: (row) => <span className="capitalize">{row.role}</span> },
    { header: 'Permissions', render: (row) => Object.values(row.permissions || {}).filter(Boolean).length },
    { header: 'Status', accessor: 'isActive', render: (row) => (
      <PlatformPill className={row.isActive ? platformStatusStyles.active : platformStatusStyles.inactive}>
        {row.isActive ? 'Active' : 'Inactive'}
      </PlatformPill>
    ) },
    { header: 'Actions', accessor: '_id', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row)} className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600" title="Edit admin">
          <FiEdit2 className="h-4 w-4" />
        </button>
        <button onClick={() => handleToggleStatus(row._id, row.isActive)} className="rounded-lg p-2 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600" title={row.isActive ? 'Deactivate' : 'Activate'}>
          {row.isActive ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
        </button>
      </div>
    ) },
  ]

  const activeAdmins = admins.filter((admin) => admin.isActive).length

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Access Control"
        title="Admin Management"
        description="Manage platform administrators, permissions, and active access for sensitive platform operations."
        icon={FiShield}
        actions={<Button onClick={() => { setEditing(null); reset(); setModalOpen(true); }}><FiUserPlus className="mr-2" /> Add Admin</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Admins" value={admins.length} sub="Total platform users" icon={FiUsers} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Active" value={activeAdmins} sub={`${admins.length - activeAdmins} inactive`} icon={FiUserCheck} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Permission sets" value={admins.reduce((sum, admin) => sum + Object.values(admin.permissions || {}).filter(Boolean).length, 0)} sub="Enabled capabilities" icon={FiShield} accent="from-amber-500 to-orange-500" />
      </div>

      <Card title="Platform Admins">
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
              <label className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800"><input type="checkbox" {...register('permissions.manageRestaurants')} /> Manage Restaurants</label>
              <label className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800"><input type="checkbox" {...register('permissions.manageSubscriptions')} /> Manage Subscriptions</label>
              <label className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800"><input type="checkbox" {...register('permissions.manageCMS')} /> Manage CMS</label>
              <label className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800"><input type="checkbox" {...register('permissions.verifyKYC')} /> Verify KYC</label>
              <label className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800"><input type="checkbox" {...register('permissions.viewAnalytics')} /> View Analytics</label>
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
