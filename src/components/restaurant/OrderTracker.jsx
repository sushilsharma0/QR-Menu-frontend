import React from 'react'
import { FiCheck, FiClock, FiCoffee, FiSmile } from 'react-icons/fi'

const OrderTracker = ({ order }) => {
  const steps = [
    { key: 'pending', label: 'Order Received', icon: FiClock },
    { key: 'confirmed', label: 'Order Confirmed', icon: FiCheck },
    { key: 'preparing', label: 'Preparing', icon: FiCoffee },
    { key: 'ready', label: 'Ready for Pickup', icon: FiSmile },
  ]

  const currentIndex = steps.findIndex(s => s.key === order?.status)

  return (
    <div className="relative">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center mb-8 last:mb-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
            idx <= currentIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            <step.icon className="h-5 w-5" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex justify-between items-center">
              <h3 className={`font-medium ${idx <= currentIndex ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.label}
              </h3>
              {idx === currentIndex && order?.estimatedWaitTime && (
                <span className="text-sm text-blue-600">~{order.estimatedWaitTime} min</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderTracker