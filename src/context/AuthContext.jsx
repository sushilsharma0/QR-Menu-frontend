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
      
      const { token: newToken, user: userData } = response.data.data
      
      if (!newToken || !userData) {
        throw new Error('Invalid response structure from server')
      }
      
      // Store in localStorage
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Update state
      setToken(newToken)
      setUser(userData)
      
      toast.success(`Welcome ${userData.name || email}!`)
      
      // Redirect based on role
      if (userData.role === 'super_admin' || userData.role === 'admin') {
        navigate('/platform/dashboard')
      } else if (userData.role === 'restaurant') {
        navigate('/restaurant/dashboard')
      } else if (userData.role === 'kitchen') {
        navigate('/kitchen/dashboard')
      } else if (userData.role === 'cashier') {
        navigate('/cashier/dashboard')
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