import React from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

const WaiterLogin = () => {
  const [searchParams] = useSearchParams()
  const restaurantId = searchParams.get('restaurantId') || ''
  const next = `/login?role=employee&staff=waiter${restaurantId ? `&restaurantId=${encodeURIComponent(restaurantId)}` : ''}`
  return <Navigate to={next} replace />
}

export default WaiterLogin
