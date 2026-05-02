import React, { createContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)
  const isAuthenticated = Boolean(token && user)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user:', e)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [token])

  const login = async (email, password, role, restaurantId = null) => {
    try {
      let endpoint = ''
      let requestData = {}
      
      if (role === 'platform') {
        endpoint = '/platform/auth/login'
        requestData = { email, password }
      } else if (role === 'restaurant') {
        endpoint = '/restaurant/auth/login'
        requestData = { email, password }
      } else if (role === 'employee') {
        endpoint = '/restaurant/employees/login'
        requestData = { username: email, password, restaurantId }
      }
      
      console.log('📤 Login request:', { endpoint, email: email.substring(0, 5) + '***' })
      
      const response = await api.post(endpoint, requestData)
      
      console.log('📥 Login response:', response.data)
      
      const { token: newToken, user: userData, employee: employeeData } = response.data.data
      const rawUser = userData || employeeData
      const authUser = {
        ...rawUser,
        scope: role === 'employee' ? 'employee' : role
      }
      
      if (!newToken || !rawUser) {
        throw new Error('Invalid response structure from server')
      }
      
      // Store in localStorage
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(authUser))
      
      // Update state
      setToken(newToken)
      setUser(authUser)
      
      toast.success(`Welcome ${authUser.name || email}!`)

      if (authUser.role === 'restaurant') {
        if (!authUser.isKYCVerified) {
          toast('Kindly verify your KYC to unlock menu, tables, staff and order actions.', {
            duration: 6500,
          })
        }
        if (authUser.trialEndsAt && !authUser.hasPaidPlanActive) {
          const days = Math.ceil(
            (new Date(authUser.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          if (days > 0) {
            toast(`Your ${days}-day${days === 1 ? '' : 's'} free trial is active. Subscribe before it ends to keep access.`, {
              duration: 5500,
            })
          } else if (authUser.needsPlanUpgrade) {
            toast.error('Your trial has ended. Upgrade your plan from Subscription to continue.')
          }
        }
      }
      
      // Redirect based on role
      if (authUser.scope === 'employee' && authUser.mustChangePassword) {
        navigate('/employee/change-password')
      } else if (authUser.scope === 'employee' && authUser.role === 'kitchen') {
        navigate('/kitchen/dashboard')
      } else if (authUser.scope === 'employee' && authUser.role === 'cashier') {
        navigate('/cashier/dashboard')
      } else if (authUser.scope === 'employee') {
        navigate('/employee/orders')
      } else if (authUser.role === 'super_admin' || authUser.role === 'admin') {
        navigate('/platform/dashboard')
      } else if (authUser.role === 'restaurant') {
        navigate('/restaurant/dashboard')
      } else {
        navigate('/')
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const mergeUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, mergeUser }}>
      {children}
    </AuthContext.Provider>
  )
}