import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiEdit2,
  FiFilter,
  FiGrid,
  FiKey,
  FiList,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantDateTime,
} from '../../components/restaurant/RestaurantUI'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const roleStyles = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  kitchen: 'bg-yellow-100 text-yellow-800',
  cashier: 'bg-green-100 text-green-800',
  waiter: 'bg-indigo-100 text-indigo-800',
}

const statusStyles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
}

const DEFAULT_FILTERS = { search: '', role: '', status: '' }
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1,
  )

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{start}-{end}</span> of{' '}
        <span className="font-semibold text-gray-900">{total}</span> employees
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((number, index) => {
            const previous = pages[index - 1]
            const showGap = previous && number - previous > 1
            return (
              <React.Fragment key={number}>
                {showGap && <span className="px-1 text-sm text-gray-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(number)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                    number === page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'border border-surface-200 bg-white text-gray-600 hover:bg-surface-50'
                  }`}
                >
                  {number}
                </button>
              </React.Fragment>
            )
          })}
        </div>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

function EmployeeAvatar({ employee, size = 'lg' }) {
  const sizes = {
    sm: 'h-11 w-11 rounded-2xl text-sm',
    lg: 'h-24 w-24 rounded-3xl text-2xl',
  }
  const initials = String(employee.name || employee.username || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`overflow-hidden border-4 border-white bg-primary-50 font-black text-primary-700 shadow-sm ${sizes[size]}`}>
      {employee.profileImage ? (
        <img src={employee.profileImage} alt={employee.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{initials}</div>
      )}
    </div>
  )
}

function MetricTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-surface-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

function EmployeeActions({ employee, onEdit, onDelete, onResetPassword }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onResetPassword(employee._id)}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600"
        title="Reset Password"
      >
        <FiKey className="h-4 w-4" />
      </button>
      <button
        onClick={() => onEdit(employee)}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
        title="Edit"
      >
        <FiEdit2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDelete(employee._id)}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

const Employees = () => {
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState('list')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const restaurantId = user?.id || user?._id || 'N/A'

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/employees')
      setEmployees(res.data.data || [])
    } catch {
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/restaurant/employees/${id}`)
      toast.success('Employee deleted')
      fetchEmployees()
    } catch {
      toast.error('Failed to delete employee')
    }
  }

  const handleResetPassword = async (id) => {
    try {
      const res = await api.patch(`/restaurant/employees/${id}/reset-password`)
      const { credentialsEmailSent, defaultPassword } = res.data.data || {}
      if (credentialsEmailSent) {
        toast.success('Password reset. New credentials emailed to the employee.')
      } else if (defaultPassword) {
        toast.success(`Password reset. Temp password: ${defaultPassword}`)
      } else {
        toast.success('Password reset successfully.')
      }
    } catch {
      toast.error('Failed to reset password')
    }
  }

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase()
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.username?.toLowerCase().includes(q) ||
        emp.phone?.toLowerCase().includes(q)

      const matchesRole = !filters.role || emp.role === filters.role
      const matchesStatus =
        !filters.status ||
        (filters.status === 'active' && emp.isActive) ||
        (filters.status === 'inactive' && !emp.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [employees, filters])

  const metrics = useMemo(() => {
    const active = employees.filter((emp) => emp.isActive).length
    const withPhotos = employees.filter((emp) => emp.profileImage).length
    const roleCount = new Set(employees.map((emp) => emp.role)).size
    return { total: employees.length, active, inactive: employees.length - active, withPhotos, roleCount }
  }, [employees])

  const activeFilterCount = [filters.search, filters.role, filters.status].filter(Boolean).length
  const clearFilters = () => setFilters(DEFAULT_FILTERS)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedEmployees = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filters, pageSize, viewMode])

  if (loading) return <RestaurantPageLoader />

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiUsers className="h-4 w-4" />
                Team Directory
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Employees</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Manage restaurant staff profiles, roles, access, and login credentials in one polished workspace.
              </p>
              <p className="mt-2 text-xs text-blue-700">
                Restaurant ID: <span className="font-mono font-semibold">{restaurantId}</span>
              </p>
            </div>
            <Button onClick={() => navigate(`${restaurantBase}/employees/new`)}>
              <FiPlus className="mr-2" /> Add Employee
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total staff" value={metrics.total} sub={`${metrics.roleCount} roles`} icon={FiUsers} accent="from-primary-600 to-secondary-500" />
            <MetricTile label="Active" value={metrics.active} sub={`${metrics.inactive} inactive`} icon={FiUserCheck} accent="from-emerald-500 to-teal-500" />
            <MetricTile label="Profile photos" value={metrics.withPhotos} sub="Photo-ready cards" icon={FiShield} accent="from-indigo-500 to-violet-500" />
            <MetricTile label="Filtered view" value={filtered.length} sub={`${activeFilterCount} filters active`} icon={FiFilter} accent="from-amber-500 to-orange-500" />
          </div>
        </div>
      </motion.section>

      <Card
        title="Filters"
        icon={FiFilter}
        actions={
          <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${viewMode === 'card' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'}`}
            >
              <FiGrid className="h-4 w-4" /> Card
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'}`}
            >
              <FiList className="h-4 w-4" /> List
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            icon={FiSearch}
            label="Search employees"
            placeholder="Name, email, phone or username"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="kitchen">Kitchen</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-surface-200 pt-4">
            <span className="text-sm font-medium text-gray-500">{activeFilterCount} active filter(s)</span>
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline">
              <FiX className="h-4 w-4" /> Clear all
            </button>
          </div>
        )}
      </Card>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-surface-200 bg-white px-4 text-center shadow-sm"
          >
            <FiSearch className="h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-950">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">Try another role, status, or search term.</p>
            {activeFilterCount > 0 && (
              <Button className="mt-4" variant="secondary" onClick={clearFilters}>Clear filters</Button>
            )}
          </motion.div>
        ) : viewMode === 'card' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {paginatedEmployees.map((emp, index) => (
              <motion.article
                key={emp._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
                whileHover={{ y: -5 }}
                className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="h-24 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
                <div className="-mt-12 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <EmployeeAvatar employee={emp} />
                    <EmployeeActions
                      employee={emp}
                      onResetPassword={handleResetPassword}
                      onEdit={(employee) => navigate(`${restaurantBase}/employees/${employee._id}/edit`)}
                      onDelete={handleDelete}
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-gray-950">{emp.name}</h3>
                    <p className="text-sm text-gray-500">@{emp.username}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <RestaurantStatusPill value={emp.role} styles={roleStyles} />
                    <RestaurantStatusPill value={emp.isActive ? 'active' : 'inactive'} styles={statusStyles} />
                  </div>
                  <div className="mt-4 space-y-2 rounded-2xl bg-surface-50 p-4 text-sm">
                    <p className="truncate text-gray-600">{emp.email}</p>
                    <p className="text-gray-600">{emp.phone || 'No phone added'}</p>
                    <p className="text-xs text-gray-500">Last login: {emp.lastLogin ? formatRestaurantDateTime(emp.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-x-auto rounded-3xl border border-surface-200 bg-white shadow-sm"
          >
            <table className="min-w-full divide-y divide-surface-200">
              <thead className="bg-surface-50">
                <tr>
                  {['Employee', 'Username', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 bg-white">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp._id} className="transition hover:bg-surface-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar employee={emp} size="sm" />
                        <div>
                          <p className="font-bold text-gray-950">{emp.name}</p>
                          <p className="text-sm text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{emp.username}</td>
                    <td className="px-5 py-4"><RestaurantStatusPill value={emp.role} styles={roleStyles} /></td>
                    <td className="px-5 py-4">
                      <RestaurantStatusPill value={emp.isActive ? 'active' : 'inactive'} styles={statusStyles} />
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{emp.lastLogin ? formatRestaurantDateTime(emp.lastLogin) : 'Never'}</td>
                    <td className="px-5 py-4">
                      <EmployeeActions
                        employee={emp}
                        onResetPassword={handleResetPassword}
                        onEdit={(employee) => navigate(`${restaurantBase}/employees/${employee._id}/edit`)}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length > 0 && (
        <PaginationBar
          page={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  )
}

export default Employees
