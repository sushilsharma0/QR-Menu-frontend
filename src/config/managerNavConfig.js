import {
  FiBarChart2,
  FiClipboard,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'

/** Manager portal sidebar — segment paths under /manager/:slug/:restaurantId */
export const MANAGER_NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FiHome,
    defaultOpen: true,
    items: [{ segment: 'dashboard', label: 'Dashboard', icon: FiHome }],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: FiShoppingBag,
    defaultOpen: true,
    items: [
      { segment: 'orders', label: 'Orders', icon: FiShoppingBag },
      { segment: 'tables', label: 'Tables', icon: FiGrid },
      { segment: 'payments', label: 'Payments', icon: TbCurrencyRupee },
      { segment: 'pos', label: 'POS', icon: FiCreditCard },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: FiBarChart2,
    defaultOpen: true,
    items: [
      { segment: 'sales-activity', label: 'Sales Activity', icon: FiTrendingUp },
      { segment: 'reports', label: 'Reports', icon: FiClipboard },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: FiUsers,
    defaultOpen: false,
    items: [{ segment: 'team', label: 'Staff', icon: FiUsers }],
  },
]

export function managerSectionContainsSegment(section, tail) {
  const root = String(tail || '').split('/')[0]
  return section.items.some((item) => item.segment === root || tail.startsWith(`${item.segment}/`))
}
