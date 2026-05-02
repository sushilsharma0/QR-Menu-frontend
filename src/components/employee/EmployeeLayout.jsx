import React from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FiLogOut, FiUser, FiBell, FiHome, FiShoppingCart, FiClock, FiDollarSign } from 'react-icons/fi'
import toast from 'react-hot-toast'

const EmployeeLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const getRoleIcon = () => {
    if (user?.role === 'kitchen') return '👨‍🍳'
    if (user?.role === 'cashier') return '💰'
    return '👤'
  }

  const getRoleTitle = () => {
    if (user?.role === 'kitchen') return 'Kitchen Dashboard'
    if (user?.role === 'cashier') return 'Cashier Dashboard'
    return 'Employee Dashboard'
  }

  const navItems = [
    { path: '/employee/orders', label: 'Order History', icon: FiClock, role: 'kitchen' },
    { path: '/cashier/dashboard', label: 'Orders', icon: FiDollarSign, role: 'cashier' },
  ]

  const currentNavItems = navItems.filter(item => item.role === user?.role)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl">{getRoleIcon()}</span>
                <span className="text-xl font-bold text-primary-600">QR Menu SaaS</span>
              </Link>
              <span className="text-sm text-gray-500 hidden md:inline">|</span>
              <span className="text-sm text-gray-600 hidden md:inline">{getRoleTitle()}</span>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FiBell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-primary-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {currentNavItems.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8">
            <nav className="flex gap-8">
              {currentNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white sticky bottom-0 w-full border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} QR Menu SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default EmployeeLayout