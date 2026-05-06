import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { FiPlus, FiEdit2, FiTrash2, FiKey, FiSearch, FiX, FiFilter } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

// ── Role badge
const getRoleBadge = (role) => {
  const styles = {
    admin:   'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100   text-blue-800',
    kitchen: 'bg-yellow-100 text-yellow-800',
    cashier: 'bg-green-100  text-green-800',
    waiter:  'bg-indigo-100 text-indigo-800',
  }
  return (
    <span className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${styles[role] || styles.admin}`}>
      {role}
    </span>
  )
}

const DEFAULT_FILTERS = { search: '', role: '', status: '' }

const Employees = () => {
  const navigate        = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { user }        = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filters,   setFilters]   = useState(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const restaurantId = user?.id || user?._id || 'N/A'

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/employees')
      setEmployees(res.data.data)
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

  // ── Client-side filter + search
  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase()
    return employees.filter(emp => {
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q)     ||
        emp.email?.toLowerCase().includes(q)    ||
        emp.username?.toLowerCase().includes(q)

      const matchesRole   = !filters.role   || emp.role === filters.role
      const matchesStatus =
        !filters.status ||
        (filters.status === 'active'   &&  emp.isActive) ||
        (filters.status === 'inactive' && !emp.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [employees, filters])

  const activeFilterCount = [
    filters.search,
    filters.role,
    filters.status,
  ].filter(Boolean).length

  const clearFilters = () => setFilters(DEFAULT_FILTERS)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant staff</p>
          <p className="text-sm text-blue-700 mt-1">
            Restaurant ID:{' '}
            <span className="font-mono font-semibold">{restaurantId}</span>
          </p>
        </div>
        <Button onClick={() => navigate(`${restaurantBase}/employees/new`)}>
          <FiPlus className="mr-2" /> Add Employee
        </Button>
      </div>

      {/* ── Filter bar */}
      <Card>
        <div className="flex flex-col gap-4">

          {/* Top row — search + toggle */}
          <div className="flex gap-3 items-center flex-wrap">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, email or username..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(f => ({ ...f, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'bg-primary-50 border-primary-400 text-primary-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiFilter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 font-medium hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Expandable filter row */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">

              {/* Role filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cashier">Cashier</option>
                  <option value="waiter">Waiter</option>
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* ── Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of{' '}
          <span className="font-semibold text-gray-700">{employees.length}</span> employees
        </p>
        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.role && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                Role: {filters.role}
                <button onClick={() => setFilters(f => ({ ...f, role: '' }))}>
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                Status: {filters.status}
                <button onClick={() => setFilters(f => ({ ...f, status: '' }))}>
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Restaurant ID', 'Username', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(emp => (
                <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-500">{emp.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {emp.restaurant || restaurantId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.username}</td>
                  <td className="px-6 py-4">{getRoleBadge(emp.role)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(emp._id)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <FiKey className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`${restaurantBase}/employees/${emp._id}/edit`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FiSearch className="h-8 w-8 text-gray-300" />
                      <p className="font-medium text-gray-500">No employees found</p>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline mt-1">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}

export default Employees