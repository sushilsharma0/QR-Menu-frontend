import {
  FiBarChart2,
  FiBookOpen,
  FiCoffee,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiMapPin,
  FiPercent,
  FiPieChart,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiTerminal,
  FiUsers,
} from 'react-icons/fi'

/**
 * Restaurant sidebar navigation — each item may declare featureKey (planFeatureFlags).
 * Items without featureKey are always shown (e.g. KYC, Subscription).
 */
export const RESTAURANT_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { segment: 'dashboard', icon: FiHome, label: 'Dashboard', featureKey: 'analytics' },
      { segment: 'orders/activity', icon: FiBarChart2, label: 'Sales activity', featureKey: 'analytics' },
    ],
  },
  {
    label: 'Service',
    items: [
      { segment: 'pos', icon: FiCoffee, label: 'POS', featureKey: 'customerOrders' },
      { segment: 'orders', icon: FiShoppingBag, label: 'Orders', featureKey: 'orders' },
      { segment: 'menu', icon: FiBookOpen, label: 'Menu', featureKey: 'menu' },
      { segment: 'tables', icon: FiMapPin, label: 'Tables & QR', featureKey: 'tables' },
      { segment: 'promotions', icon: FiPercent, label: 'Promotions', featureKey: 'promotions' },
      { segment: 'credit-customers', icon: FiDollarSign, label: 'Credit customers', featureKey: 'creditCustomers' },
    ],
  },
  {
    label: 'Business',
    items: [
      { segment: 'employees', icon: FiUsers, label: 'Employees', featureKey: 'employees' },
      { segment: 'branches', icon: FiMapPin, label: 'Branches', featureKey: 'branches' },
      { segment: 'kyc', icon: FiShield, label: 'KYC' },
      { segment: 'subscription', icon: FiCreditCard, label: 'Subscription' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { segment: 'finance/dashboard', icon: FiBarChart2, label: 'Finance Dashboard', featureKey: 'analytics' },
      { segment: 'finance/expenses', icon: FiCreditCard, label: 'Expenses', featureKey: 'analytics' },
      { segment: 'finance/budget', icon: FiPieChart, label: 'Budget', featureKey: 'analytics' },
      { segment: 'finance/profit-loss', icon: FiPercent, label: 'Profit & Loss', featureKey: 'analytics' },
      { segment: 'finance/inventory', icon: FiBookOpen, label: 'Inventory', featureKey: 'inventory' },
      { segment: 'finance/payroll', icon: FiUsers, label: 'Payroll', featureKey: 'employees' },
      { segment: 'finance/invoices', icon: FiFileText, label: 'Invoices', featureKey: 'billing' },
    ],
  },
  {
    label: 'Support',
    items: [
      { segment: 'tickets', icon: FiHelpCircle, label: 'Support Tickets', featureKey: 'supportTickets' },
      { segment: 'logs', icon: FiTerminal, label: 'Audit Logs', featureKey: 'activityLogs' },
      { segment: 'security', icon: FiShield, label: 'Active Devices' },
      { segment: 'backup-recovery', icon: FiDatabase, label: 'Backup & Recovery', featureKey: 'backup' },
      { segment: 'public-profile', icon: FiFileText, label: 'About & Privacy', featureKey: 'accountSettings' },
      { segment: 'settings', icon: FiSettings, label: 'Settings', featureKey: 'accountSettings' },
    ],
  },
]
