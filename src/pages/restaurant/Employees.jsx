import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiKey } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

const Employees = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const restaurantId = user?.id || user?._id || storedUser?.id || storedUser?._id || 'N/A'

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/employees')
      setEmployees(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      await api.delete(`/restaurant/employees/${id}`)
      toast.success('Employee deleted')
      fetchEmployees()
    } catch (error) {
      toast.error('Failed to delete employee')
    }
  }

  const handleResetPassword = async (id, username) => {
    if (!window.confirm(`Reset password for ${username}? Default password will be ${username}@123`)) return
    try {
      const res = await api.patch(`/restaurant/employees/${id}/reset-password`)
      toast.success(`Password reset to: ${res.data.data.defaultPassword}`)
    } catch (error) {
      toast.error('Failed to reset password')
    }
  }

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      kitchen: 'bg-yellow-100 text-yellow-800',
      cashier: 'bg-green-100 text-green-800',
      waiter: 'bg-indigo-100 text-indigo-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full capitalize ${styles[role] || styles.admin}`}>
        {role}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant staff</p>
          <p className="text-sm text-blue-700 mt-2">
            Restaurant ID: <span className="font-mono font-semibold">{restaurantId}</span>
          </p>
        </div>
        <Button onClick={() => navigate('/restaurant/employees/new')}>
          <FiPlus className="mr-2" /> Add Employee
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp._id}>
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
                    <span className={`px-2 py-1 text-xs rounded-full ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(emp._id, emp.username)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Reset Password"
                      >
                        <FiKey className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/restaurant/employees/${emp._id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No employees found
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