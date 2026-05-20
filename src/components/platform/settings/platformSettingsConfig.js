import { FiLock, FiShield, FiUser } from 'react-icons/fi'

/** Sections for platform Settings (account-only; sidebar holds the rest). */
export const PLATFORM_ACCOUNT_SECTIONS = [
  {
    id: 'overview',
    label: 'Account overview',
    description: 'Platform ID, status, last sign-in — read-only. Copy ID for support.',
    icon: FiShield,
    accent: 'from-slate-600 to-gray-800',
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Employee ID, role, designation, email, photo, and bio.',
    icon: FiUser,
    accent: 'from-primary-500 to-violet-600',
  },
  {
    id: 'security',
    label: 'Password',
    description: 'Change your sign-in password.',
    icon: FiLock,
    accent: 'from-amber-500 to-orange-600',
  },
]

/** @deprecated alias */
export const PLATFORM_SETTINGS_SECTIONS = PLATFORM_ACCOUNT_SECTIONS

export function getPlatformSectionById(id) {
  return PLATFORM_ACCOUNT_SECTIONS.find((s) => s.id === id) || null
}
