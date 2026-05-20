import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import api from '../../../services/api'
import Card from '../../common/Card'
import Button from '../../common/Button'
import Input from '../../common/Input'
import AdminEmployeeDetailsPreview from '../AdminEmployeeDetailsPreview'
import { FiUser } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth'
import { usePlatformAccess } from '../../../hooks/usePlatformAccess'

const IMAGE_MAX_BYTES = 2 * 1024 * 1024

export default function PlatformProfileSection() {
  const { user, mergeUser } = useAuth()
  const { isSuperAdmin } = usePlatformAccess()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [employee, setEmployee] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get('/platform/auth/profile')
        const data = res.data?.data
        if (!cancelled && data) {
          reset({ name: data.name || '', bio: data.bio || '' })
          setPhotoPreview(data.profileImage || user?.profileImage || '')
          setEmployee({
            employeeCode: data.employeeCode,
            name: data.name,
            email: data.email,
            role: data.role,
            designation: data.designation,
            department: data.department,
          })
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reset, user?.profileImage])

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > IMAGE_MAX_BYTES) {
      toast.error('Profile photo must be under 2 MB')
      event.target.value = ''
      return
    }
    setPhotoFile(file)
    if (file) setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('name', data.name || '')
      fd.append('bio', data.bio || '')
      if (photoFile) fd.append('profileImage', photoFile)

      const res = await api.patch('/platform/auth/profile', fd)
      const saved = res.data?.data
      const profileImage = saved?.profileImage || photoPreview
      setPhotoPreview(profileImage)
      setPhotoFile(null)
      setEmployee((prev) => ({
        ...prev,
        name: saved?.name || data.name,
        email: saved?.email || prev?.email,
        role: saved?.role || prev?.role,
        employeeCode: saved?.employeeCode ?? prev?.employeeCode,
        designation: saved?.designation ?? prev?.designation,
        department: saved?.department ?? prev?.department,
      }))
      mergeUser({
        name: saved?.name || data.name,
        bio: saved?.bio ?? data.bio,
        profileImage,
      })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  const missingEmployeeId = isSuperAdmin && !employee?.employeeCode

  return (
    <div className="max-w-2xl space-y-6">
      {employee && (
        <AdminEmployeeDetailsPreview
          employeeCode={employee.employeeCode}
          name={employee.name}
          email={employee.email}
          role={employee.role}
          designation={employee.designation}
          department={employee.department}
          title="Your platform employee record"
        />
      )}

      {missingEmployeeId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-bold">Employee ID not set</p>
          <p className="mt-1">
            Add designation, department, and employee ID under{' '}
            <Link to="/platform/admins" className="font-semibold underline">
              System → Admins
            </Link>{' '}
            (Super admin card → Edit employee details) so payroll and audits stay consistent.
          </p>
        </div>
      )}

      {isSuperAdmin && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          To change employee ID, designation, or department, use{' '}
          <Link to="/platform/admins" className="font-semibold text-primary-600 underline dark:text-primary-400">
            Admins → Edit employee details
          </Link>
          . Gmail and console role are managed there as well.
        </p>
      )}

      <Card title="Your profile" icon={FiUser}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/60">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Profile photo
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Shown in the top header and profile menu. Square image recommended (512×512 px).
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 ring-2 ring-white dark:bg-gray-800 dark:ring-gray-900">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <FiUser className="h-8 w-8 text-primary-600 dark:text-primary-300" />
                )}
              </div>
              <div>
                <input type="file" accept="image/*" className="text-sm" onChange={onPhotoChange} />
                <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP. Max 2 MB.</p>
              </div>
            </div>
          </section>

          <Input
            label="Display name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Short note about your role or how to reach you"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
              {...register('bio', { maxLength: { value: 500, message: 'Max 500 characters' } })}
            />
            <p className="mt-1 text-xs text-gray-500">Optional. Up to 500 characters.</p>
          </div>

          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </form>
      </Card>
    </div>
  )
}
