// RestaurantSidebar.jsx
import React, { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  FiHome, FiMenu, FiShoppingCart, FiGrid, FiUsers,
  FiFileText, FiCreditCard, FiSettings, FiTag,
  FiActivity, FiChevronLeft, FiChevronRight, FiX,
  FiExternalLink, FiBarChart2,
} from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

function staffLoginHref(restaurantId, staff) {
  const q = new URLSearchParams({ role: 'employee', staff, restaurantId: String(restaurantId) })
  return `/login?${q.toString()}`
}

const NAV_ITEMS = [
  { segment: 'dashboard',    icon: FiHome,        label: 'Dashboard'       },
  { segment: 'menu',         icon: FiMenu,        label: 'Menu'            },
  { segment: 'orders',       icon: FiShoppingCart,label: 'Orders'          },
  { segment: 'orders/activity', icon: FiBarChart2, label: 'Sales activity' },
  { segment: 'tables',       icon: FiGrid,        label: 'Tables'          },
  { segment: 'employees',    icon: FiUsers,       label: 'Employees'       },
  { segment: 'kyc',          icon: FiFileText,    label: 'KYC'             },
  { segment: 'subscription', icon: FiCreditCard,  label: 'Subscription'    },
  { segment: 'transactions', icon: FiCreditCard,  label: 'Transactions'    },
  { segment: 'promotions',   icon: FiTag,         label: 'Promotions'      },
  { segment: 'tickets',      icon: FiActivity,    label: 'Support Tickets' },
  { segment: 'logs',         icon: FiActivity,    label: 'System Logs'     },
  { segment: 'settings',     icon: FiSettings,    label: 'Settings'        },
]

const STAFF_LINKS = [
  { staff: 'kitchen', label: 'Kitchen Staff Login' },
  { staff: 'cashier', label: 'Cashier Staff Login' },
  { staff: 'waiter',  label: 'Waiter Staff Login'  },
]

// ── Shared nav link used in both expanded and collapsed sidebar
function NavItem({ item, restaurantBase, pendingCount, collapsed, onClick }) {
  return (
    <NavLink
      to={`${restaurantBase}/${item.segment}`}
      end={item.segment === 'orders'}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
        ${isActive
          ? 'bg-primary-50 text-primary-700 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />

          {/* Label — hidden when collapsed */}
          {!collapsed && <span className="text-sm truncate">{item.label}</span>}

          {/* Pending badge */}
          {item.segment === 'orders' && pendingCount > 0 && (
            <span className={`
              min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold
              flex items-center justify-center flex-shrink-0
              ${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}
            `}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}

          {/* Tooltip for collapsed mode */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
              opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              {item.label}
              {item.segment === 'orders' && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {/* Arrow */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar inner content (shared between desktop + mobile drawer)
function SidebarContent({ collapsed, setCollapsed, pendingCount, restaurantBase, restaurantId, hasTenant, onClose, isMobile }) {
  return (
    <div className="flex flex-col h-full">

      {/* Brand header */}
      <div className={`flex items-center border-b border-gray-100 flex-shrink-0
        ${collapsed && !isMobile ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'}`}>
        {(!collapsed || isMobile) && (
          <div>
            <h1 className="text-base font-bold text-primary-600 leading-none">QR Menu SaaS</h1>
            <p className="text-xs text-gray-500 mt-0.5">Restaurant Portal</p>
          </div>
        )}

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0
              ${collapsed ? '' : ''}`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <FiChevronRight className="h-4 w-4 text-gray-500" />
              : <FiChevronLeft  className="h-4 w-4 text-gray-500" />
            }
          </button>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <FiX className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.segment}
            item={item}
            restaurantBase={restaurantBase}
            pendingCount={pendingCount}
            collapsed={collapsed && !isMobile}
            onClick={isMobile ? onClose : undefined}
          />
        ))}

        {/* Staff login links */}
        {hasTenant && restaurantId != null && (!collapsed || isMobile) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Staff Logins
            </p>
            {STAFF_LINKS.map(({ staff, label }) => (
              <Link key={staff}
                to={staffLoginHref(restaurantId, staff)}
                target="_blank" rel="noopener noreferrer"
                onClick={isMobile ? onClose : undefined}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-500
                  hover:bg-gray-100 hover:text-gray-800 transition-colors group"
              >
                <FiExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Collapsed staff links — just icons with tooltips */}
        {hasTenant && restaurantId != null && collapsed && !isMobile && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-0.5">
            {STAFF_LINKS.map(({ staff, label }) => (
              <Link key={staff}
                to={staffLoginHref(restaurantId, staff)}
                target="_blank" rel="noopener noreferrer"
                title={label}
                className="relative flex items-center justify-center px-3 py-2.5 rounded-xl
                  text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors group"
              >
                <FiExternalLink className="h-4 w-4" />
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  )
}

// ── Main exported component
const RestaurantSidebar = () => {
  const { user }                                   = useAuth()
  const { socket }                                 = useSocket()
  const { restaurantBase, restaurantId, hasTenant } = useTenantRoutes()
  const [pendingCount, setPendingCount]            = useState(0)
  const [collapsed, setCollapsed]                  = useState(false)   // desktop only
  const [mobileOpen, setMobileOpen]                = useState(false)   // mobile drawer

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/restaurant/customer-orders', { params: { status: 'pending', page: 1, limit: 1 } })
      setPendingCount(res?.data?.data?.pagination?.total || 0)
    } catch { setPendingCount(0) }
  }

  useEffect(() => { fetchPendingCount() }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('new_order',     fetchPendingCount)
    socket.on('order_updated', fetchPendingCount)
    return () => {
      socket.off('new_order',     fetchPendingCount)
      socket.off('order_updated', fetchPendingCount)
    }
  }, [socket])

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [restaurantBase])

  if (!user || !hasTenant) return null

  const sharedProps = { pendingCount, restaurantBase, restaurantId, hasTenant }

  return (
    <>
      {/* ── Mobile top bar (visible on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"
        >
          <FiMenu className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-sm font-bold text-primary-600">QR Menu SaaS</h1>
        {/* Pending badge on mobile top bar */}
        {pendingCount > 0 && (
          <span className="ml-auto min-w-[22px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </div>

      {/* ── Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent
          {...sharedProps}
          collapsed={false}
          setCollapsed={setCollapsed}
          onClose={() => setMobileOpen(false)}
          isMobile={true}
        />
      </div>

      {/* ── Desktop sidebar */}
      <aside className={`
        hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-100
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-[68px]' : 'w-64'}
      `}>
        <SidebarContent
          {...sharedProps}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onClose={() => {}}
          isMobile={false}
        />
      </aside>
    </>
  )
}

export default RestaurantSidebar