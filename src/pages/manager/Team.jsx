import React, { useEffect, useState } from 'react'
import { FiMail, FiPhone, FiUser } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Badge from '../../components/common/Badge'
import { useBranch } from '../../context/BranchContext'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'

const roleColors = {
  admin: 'purple',
  manager: 'blue',
  kitchen: 'orange',
  cashier: 'green',
  waiter: 'indigo',
  accountant: 'gray',
}

const ManagerTeam = () => {
  const { selectedBranchId, loading: branchesLoading } = useBranch()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (branchesLoading) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/restaurant/employees/branch-team')
        setStaff(Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [])
      } catch {
        toast.error('Failed to load team')
        setStaff([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [branchesLoading, selectedBranchId])

  if (loading) return <RestaurantPageLoader />

  const activeCount = staff.filter((e) => e.isActive !== false).length

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">Team</p>
        <h1 className="text-2xl font-black text-gray-950 dark:text-gray-100">Branch staff</h1>
        <p className="mt-1 text-sm text-gray-500">
          {activeCount} active of {staff.length} assigned to this branch. Contact your owner for HR changes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => (
          <article
            key={member._id}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-gray-800">
                {member.profileImage ? (
                  <img src={member.profileImage} alt="" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <FiUser className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-bold text-gray-950 dark:text-gray-100">{member.name}</h2>
                  <Badge variant={roleColors[member.role] || 'default'}>{member.role}</Badge>
                  {member.isActive === false && <Badge variant="red">Inactive</Badge>}
                </div>
                {member.designation && (
                  <p className="text-sm text-gray-500">{member.designation}</p>
                )}
                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {member.email && (
                    <p className="flex items-center gap-2 truncate">
                      <FiMail className="h-4 w-4 shrink-0" />
                      {member.email}
                    </p>
                  )}
                  {member.phone && (
                    <p className="flex items-center gap-2">
                      <FiPhone className="h-4 w-4 shrink-0" />
                      {member.phone}
                    </p>
                  )}
                </div>
                {member.lastLogin && (
                  <p className="mt-2 text-xs text-gray-400">
                    Last login {new Date(member.lastLogin).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!staff.length && (
        <p className="rounded-2xl border border-dashed border-surface-200 py-16 text-center text-sm text-gray-500">
          No staff assigned to this branch yet.
        </p>
      )}
    </div>
  )
}

export default ManagerTeam
