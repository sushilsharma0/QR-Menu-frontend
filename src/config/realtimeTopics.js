export const REALTIME_TOPICS = {
  ALL: 'all',
  SUBSCRIPTION: 'subscription',
  MENU: 'menu',
  ORDERS: 'orders',
  TABLES: 'tables',
  STAFF: 'staff',
  KYC: 'kyc',
  SETTINGS: 'settings',
  BRANCHES: 'branches',
  PROMOTIONS: 'promotions',
  FINANCE: 'finance',
  INVENTORY: 'inventory',
  DASHBOARD: 'dashboard',
  BACKUP: 'backup',
  PLATFORM: 'platform',
  NOTIFICATIONS: 'notifications',
}

export function realtimeTopicEventName(topic) {
  return `realtime:${topic}`
}

export function dispatchRealtimeTopics(topics, detail = {}) {
  if (typeof window === 'undefined') return
  const list = Array.isArray(topics) ? topics : [topics]
  const payload = { topics: list, ...detail }
  list.forEach((topic) => {
    window.dispatchEvent(new CustomEvent(realtimeTopicEventName(topic), { detail: payload }))
  })
  window.dispatchEvent(new CustomEvent('realtime:any', { detail: payload }))
}
