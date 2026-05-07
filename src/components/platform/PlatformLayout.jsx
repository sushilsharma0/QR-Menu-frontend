import React from 'react'
import { Outlet } from 'react-router-dom'
import PlatformSidebar from './PlatformSidebar'
import Header from '../common/Header'

const PlatformLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default PlatformLayout