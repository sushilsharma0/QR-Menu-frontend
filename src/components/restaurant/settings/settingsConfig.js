import {
  FiAward,
  FiBell,
  FiCreditCard,
  FiDatabase,
  FiImage,
  FiSettings,
  FiSliders,
} from 'react-icons/fi'

export const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    label: 'Restaurant Profile',
    description: 'Contact details, location, hours, and currency',
    icon: FiSettings,
    accent: 'from-primary-600 to-secondary-500',
  },
  {
    id: 'themes',
    label: 'Themes & Appearance',
    description: 'Color palettes, light/dark mode, fonts, and brand assets',
    icon: FiImage,
    accent: 'from-violet-500 to-purple-600',
  },
  {
    id: 'branding',
    label: 'Logo & Background',
    description: 'Restaurant logo and customer panel background photo',
    icon: FiSliders,
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'POS, kitchen, and order alert preferences on this device',
    icon: FiBell,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    id: 'loyalty',
    label: 'Loyalty & SMS',
    description: 'Points rules and order-ready text messages',
    icon: FiAward,
    accent: 'from-primary-600 to-amber-500',
  },
  {
    id: 'backup',
    label: 'Backup & Restore',
    description: 'Encrypted backups, schedules, and restore',
    icon: FiDatabase,
    accent: 'from-emerald-500 to-teal-500',
    requiresFeature: 'backup',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    description: 'Referral code and plan billing preferences',
    icon: FiCreditCard,
    accent: 'from-rose-500 to-pink-600',
  },
]

export function getSectionById(id) {
  return SETTINGS_SECTIONS.find((section) => section.id === id) || null
}
