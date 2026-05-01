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
      
      // Redirect based on role
      if (authUser.scope === 'employee' && authUser.role === 'kitchen') {
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}