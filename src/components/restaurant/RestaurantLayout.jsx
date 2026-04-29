import React from 'react'
import { Outlet } from 'react-router-dom'
import RestaurantSidebar from './RestaurantSidebar'
import Header from '../common/Header'

const RestaurantLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <RestaurantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default RestaurantLayout