const STORAGE_KEY = 'qr_menu_selected_branch_id'

export function getSelectedBranchId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

/** When using the branch portal, keep X-Branch-Id aligned with the logged-in branch. */
export function setBranchPortalContext(branchId) {
  setStoredBranchId(branchId)
}

export function setStoredBranchId(branchId) {
  try {
    if (branchId) localStorage.setItem(STORAGE_KEY, String(branchId))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private contexts.
  }
}

/** Call on logout / restaurant login so a prior branch session cannot scope the wrong outlet. */
export function clearBranchSelection() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
