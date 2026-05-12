import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { getSelectedBranchId, setStoredBranchId, setBranchPortalContext } from '../utils/branchStorage'

const BranchContext = createContext(null)
export function BranchProvider({ children }) {
  const { user } = useAuth()
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchIdState] = useState(getSelectedBranchId())
  const [loading, setLoading] = useState(false)

  const canSwitchBranches =
    user?.role === 'restaurant' && user?.scope !== 'employee' && user?.scope !== 'branch_user'
  const activeBranches = useMemo(() => branches.filter((branch) => branch.status === 'active'), [branches])
  const selectedBranch = useMemo(
    () => branches.find((branch) => String(branch._id) === String(selectedBranchId)) || activeBranches[0] || branches[0] || null,
    [activeBranches, branches, selectedBranchId],
  )

  const persistSelectedBranch = useCallback((branchId) => {
    const value = branchId ? String(branchId) : ''
    setSelectedBranchIdState(value)
    setStoredBranchId(value)
  }, [])

  const loadBranches = useCallback(async () => {
    if (user?.scope === 'branch_user') {
      const em = user.enabledModules && typeof user.enabledModules === 'object' ? user.enabledModules : {}
      const synthetic = {
        _id: user.branchId,
        name: user.branchName || user.branchSlug || 'Branch',
        slug: user.branchSlug,
        status: 'active',
        enabledModules: em,
        publicBranchId: user.publicBranchId,
      }
      setBranches([synthetic])
      persistSelectedBranch(user.branchId)
      setBranchPortalContext(user.branchId)
      return
    }
    if (!user || !['restaurant', 'manager', 'accountant', 'admin'].includes(user.role)) return
    try {
      setLoading(true)
      const res = await api.get('/restaurant/branches', { params: { limit: 100 }, skipBranchHeader: true })
      const items = res.data?.data?.items || []
      setBranches(items)
      const employeeBranchId = user?.scope === 'employee' ? user.branchId : null
      const stored =
        employeeBranchId != null && String(employeeBranchId).length
          ? String(employeeBranchId)
          : user?.scope === 'employee'
            ? ''
            : getSelectedBranchId()
      const byStored = stored && items.find((branch) => String(branch._id) === String(stored))
      const defaultOutlet = items.find((branch) => branch.isDefault)
      const next =
        byStored ||
        defaultOutlet ||
        items.find((branch) => branch.status === 'active') ||
        items[0]
      if (next) persistSelectedBranch(next._id)
    } finally {
      setLoading(false)
    }
  }, [persistSelectedBranch, user])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  const value = useMemo(
    () => ({
      branches,
      activeBranches,
      selectedBranch,
      selectedBranchId: selectedBranch?._id || selectedBranchId,
      setSelectedBranchId: persistSelectedBranch,
      reloadBranches: loadBranches,
      loading,
      canSwitchBranches,
    }),
    [activeBranches, branches, canSwitchBranches, loadBranches, loading, persistSelectedBranch, selectedBranch, selectedBranchId],
  )

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (!context) {
    return {
      branches: [],
      activeBranches: [],
      selectedBranch: null,
      selectedBranchId: '',
      setSelectedBranchId: () => {},
      reloadBranches: () => {},
      loading: false,
      canSwitchBranches: false,
    }
  }
  return context
}
