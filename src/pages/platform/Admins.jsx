import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiEdit2, FiKey, FiShield, FiUserCheck, FiUserPlus, FiUserX, FiUsers } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import AdminPrivilegeEditor from '../../components/platform/AdminPrivilegeEditor'
import AdminHrProfileForm, { emptyHrProfile, hrProfileFromAdmin } from '../../components/platform/AdminHrProfileForm'
import PlatformPermissionGate from '../../components/platform/PlatformPermissionGate'
import { usePlatformAccess } from '../../hooks/usePlatformAccess'
import { countGrantedPrivileges, emptyPermissions, hydratePrivilegesForEditor, PERMISSION_KEYS } from '../../constants/platformPermissions'
import { PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

function mergePermissions(source = {}) {
  return hydratePrivilegesForEditor(source)
}

function countEnabled(perms) {
  return countGrantedPrivileges(perms || {})
}

function buildHrPayload(hr, employeeCode) {
  return {
    name: hr.name?.trim(),
    employeeCode: employeeCode || undefined,
    designation: hr.designation,
    department: hr.department,
    phone: hr.phone,
    joiningDate: hr.joiningDate || undefined,
    salary: Number(hr.salary) || 0,
    allowance: Number(hr.allowance) || 0,
    panNumber: hr.panNumber,
    bankName: hr.bankName,
    bankAccountNumber: hr.bankAccountNumber,
    bankBranch: hr.bankBranch,
    payrollEligible: Boolean(hr.payrollEligible),
  }
}

const Admins = () => {
  const { isSuperAdmin } = usePlatformAccess()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [privilegeAdmin, setPrivilegeAdmin] = useState(null)
  const [privileges, setPrivileges] = useState(() => emptyPermissions())
  const [savingPrivileges, setSavingPrivileges] = useState(false)
  const [createPermissions, setCreatePermissions] = useState(() => emptyPermissions())
  const [employeeCode, setEmployeeCode] = useState('')
  const [loadingCode, setLoadingCode] = useState(false)
  const [hrFields, setHrFields] = useState(() => emptyHrProfile())

  const [hrEditAdmin, setHrEditAdmin] = useState(null)
  const [editHr, setEditHr] = useState(() => emptyHrProfile())
  const [editEmployeeCode, setEditEmployeeCode] = useState('')
  const [savingHr, setSavingHr] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins()
    else setLoading(false)
  }, [isSuperAdmin])

  const fetchNextEmployeeCode = async () => {
    try {
      setLoadingCode(true)
      const res = await api.get('/platform/admins/next-employee-code')
      return res.data?.data?.employeeCode || ''
    } catch {
      toast.error('Could not generate employee ID')
      return ''
    } finally {
      setLoadingCode(false)
    }
  }

  const openCreateModal = async () => {
    reset()
    setCreatePermissions(emptyPermissions())
    setHrFields(emptyHrProfile())
    setCreateOpen(true)
    const code = await fetchNextEmployeeCode()
    setEmployeeCode(code)
  }

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const res = await api.get('/platform/admins')
      setAdmins(res.data.data || [])
    } catch {
      toast.error('Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }

  const onCreate = async (data) => {
    try {
      await api.post('/platform/admins', {
        ...buildHrPayload({ ...hrFields, name: data.name }, employeeCode),
        email: data.email,
        password: data.password,
        permissions: createPermissions,
      })
      toast.success(`Admin created${employeeCode ? ` (${employeeCode})` : ''} — listed in Platform payroll`)
      setCreateOpen(false)
      reset()
      setCreatePermissions(emptyPermissions())
      fetchAdmins()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin')
    }
  }

  const openHrEdit = (admin) => {
    setHrEditAdmin(admin)
    setEditHr(hrProfileFromAdmin(admin))
    setEditEmployeeCode(admin.employeeCode || '')
  }

  const saveHrEdit = async (e) => {
    e.preventDefault()
    if (!hrEditAdmin) return
    try {
      setSavingHr(true)
      await api.put(`/platform/admins/${hrEditAdmin._id}`, buildHrPayload(editHr, editEmployeeCode))
      toast.success(`HR profile updated for ${editHr.name || hrEditAdmin.name}`)
      setHrEditAdmin(null)
      fetchAdmins()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update HR profile')
    } finally {
      setSavingHr(false)
    }
  }

  const assignMissingEmployeeCode = async () => {
    const code = await fetchNextEmployeeCode()
    if (code) setEditEmployeeCode(code)
  }

  const openPrivileges = (admin) => {
    setPrivilegeAdmin(admin)
    setPrivileges(mergePermissions(admin.permissions))
  }

  const savePrivileges = async () => {
    if (!privilegeAdmin) return
    try {
      setSavingPrivileges(true)
      await api.patch(`/platform/admins/${privilegeAdmin._id}/permissions`, { permissions: privileges })
      toast.success(`Privileges updated for ${privilegeAdmin.name}`)
      setPrivilegeAdmin(null)
      fetchAdmins()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update privileges')
    } finally {
      setSavingPrivileges(false)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/platform/admins/${id}/toggle-status`)
      toast.success(`Admin ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchAdmins()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    {
      header: 'Employee',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-950 dark:text-gray-100">
            {row.employeeCode ? (
              <span className="text-primary-700 dark:text-primary-400">{row.employeeCode}</span>
            ) : null}
            {row.employeeCode ? ' · ' : ''}
            {row.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          {(row.designation || row.department) && (
            <p className="text-xs text-gray-400">
              {[row.designation, row.department].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Salary',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          ₹{Number(row.salary || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Privileges',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {countEnabled(row.permissions)} / {PERMISSION_KEYS.length}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <PlatformPill className={row.isActive ? platformStatusStyles.active : platformStatusStyles.inactive}>
          {row.isActive ? 'Active' : 'Inactive'}
        </PlatformPill>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openHrEdit(row)}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50 hover:text-blue-800"
            title="Edit HR profile"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openPrivileges(row)}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50 hover:text-violet-800"
            title="Edit privileges"
          >
            <FiKey className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(row._id, row.isActive)}
            className="rounded-lg p-2 text-yellow-700 transition hover:bg-yellow-50 hover:text-yellow-800"
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ]

  const activeAdmins = admins.filter((admin) => admin.isActive).length

  return (
    <PlatformPermissionGate superAdminOnly>
      <div className="space-y-6">
        <PlatformPageHeader
          badge="Super Admin"
          title="Admin & payroll employees"
          description="Each admin is also a platform employee (EMP001, …) for payroll. Edit HR anytime with the pencil icon; run payroll under System → Platform payroll."
          icon={FiShield}
          actions={
            <Button onClick={openCreateModal}>
              <FiUserPlus className="mr-2" /> Add admin
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PlatformMetric label="Admins" value={admins.length} sub="Payroll-eligible staff" icon={FiUsers} accent="from-blue-500 to-indigo-500" />
          <PlatformMetric label="Active" value={activeAdmins} sub={`${admins.length - activeAdmins} inactive`} icon={FiUserCheck} accent="from-emerald-500 to-teal-500" />
          <PlatformMetric
            label="Privileges granted"
            value={admins.reduce((sum, admin) => sum + countEnabled(admin.permissions), 0)}
            sub="Across all admins"
            icon={FiShield}
            accent="from-amber-500 to-orange-500"
          />
        </div>

        <Card title="Platform admins">
          <Table columns={columns} data={admins} loading={loading} />
        </Card>

        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create admin & employee" size="xl">
          <form onSubmit={handleSubmit(onCreate)} className="space-y-5 p-6">
            <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-primary-800 dark:text-primary-300">
                Payroll employee profile
              </p>
              <AdminHrProfileForm
                values={hrFields}
                onChange={setHrFields}
                employeeCode={employeeCode}
                onEmployeeCodeChange={setEmployeeCode}
                onRegenerateCode={async () => {
                  const code = await fetchNextEmployeeCode()
                  if (code) setEmployeeCode(code)
                }}
                loadingCode={loadingCode}
                nameRegister={register('name', { required: 'Name is required' })}
                nameError={errors.name?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Login email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
              <Input
                label="Password"
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                error={errors.password?.message}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Console privileges</p>
              <AdminPrivilegeEditor value={createPermissions} onChange={setCreatePermissions} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Create admin</Button>
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={Boolean(hrEditAdmin)}
          onClose={() => setHrEditAdmin(null)}
          title={hrEditAdmin ? `HR profile — ${hrEditAdmin.name}` : 'HR profile'}
          size="xl"
        >
          <form onSubmit={saveHrEdit} className="space-y-4 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Login email: <span className="font-medium text-gray-800 dark:text-gray-200">{hrEditAdmin?.email}</span>
              {' · '}
              Changes apply to payroll and salary slips.
            </p>
            <AdminHrProfileForm
              values={editHr}
              onChange={setEditHr}
              employeeCode={editEmployeeCode}
              onEmployeeCodeChange={setEditEmployeeCode}
              onRegenerateCode={!editEmployeeCode ? assignMissingEmployeeCode : async () => {
                const code = await fetchNextEmployeeCode()
                if (code) setEditEmployeeCode(code)
              }}
              loadingCode={loadingCode}
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={savingHr}>
                Save HR profile
              </Button>
              <Button type="button" variant="secondary" onClick={() => setHrEditAdmin(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={Boolean(privilegeAdmin)}
          onClose={() => setPrivilegeAdmin(null)}
          title={privilegeAdmin ? `Privileges — ${privilegeAdmin.name}` : 'Privileges'}
          size="xl"
        >
          <div className="space-y-4 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select what this admin can access. Super admin always has full access.
            </p>
            <AdminPrivilegeEditor value={privileges} onChange={setPrivileges} />
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={savePrivileges} loading={savingPrivileges}>
                Save privileges
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPrivilegeAdmin(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PlatformPermissionGate>
  )
}

export default Admins
