import React, { useEffect, useMemo, useState } from 'react'
import { FiBell, FiSearch } from 'react-icons/fi'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api'

const NotificationPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const fetchPage = async (targetPage = page) => {
    setLoading(true)
    try {
      const res = await getNotifications({
        page: targetPage,
        limit: 20,
        search: query || undefined,
        category: category || undefined,
        priority: priority || undefined,
        unreadOnly: unreadOnly ? 'true' : 'false',
      })
      const payload = res?.data?.data || {}
      setItems(payload.notifications || [])
      setPages(payload.pagination?.pages || 1)
      setPage(payload.pagination?.page || 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(1)
  }, [query, category, priority, unreadOnly])

  const grouped = useMemo(() => items, [items])

  return (
    <div className="space-y-4 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button className="text-sm px-3 py-2 rounded bg-primary-600 text-white" onClick={async () => {
          await markAllNotificationsRead()
          fetchPage(1)
        }}>
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 flex flex-wrap gap-2 items-center">
        <div className="flex items-center border dark:border-gray-700 rounded px-2 py-1 w-72 bg-white dark:bg-gray-900">
          <FiSearch className="text-gray-400 dark:text-gray-500" />
          <input
            className="ml-2 w-full outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100"
            placeholder="Search notifications…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="border dark:border-gray-700 bg-white dark:bg-gray-900 rounded px-2 py-1 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="auth">Auth</option>
          <option value="order">Order</option>
          <option value="kyc">KYC</option>
          <option value="subscription">Subscription</option>
          <option value="ticket">Ticket</option>
          <option value="system">System</option>
        </select>
        <select className="border dark:border-gray-700 bg-white dark:bg-gray-900 rounded px-2 py-1 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <label className="text-sm flex items-center gap-2 ml-1">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
          Unread only
        </label>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
            <FiBell className="mx-auto mb-2" /> No notifications found
          </div>
        ) : (
          grouped.map((n) => (
            <div key={n._id} className={`bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 ${n.isRead ? '' : 'border-secondary-300 dark:border-gray-700'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{n.message}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <button
                  className="text-xs px-2 py-1 border dark:border-gray-700 rounded disabled:opacity-50"
                  disabled={n.isRead}
                  onClick={async () => {
                    await markNotificationRead(n._id)
                    setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
                  }}
                >
                  {n.isRead ? 'Read' : 'Mark read'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => fetchPage(page - 1)}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400 py-1">Page {page} / {pages}</span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page >= pages}
          onClick={() => fetchPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default NotificationPage
