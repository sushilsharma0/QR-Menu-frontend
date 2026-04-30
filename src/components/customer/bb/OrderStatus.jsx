import React from 'react'
import { FiCheck, FiClock, FiCoffee, FiSmile } from 'react-icons/fi'

const OrderStatus = ({ status, estimatedWaitTime }) => {
  const steps = [
    { key: 'pending', label: 'Order Received', icon: FiClock },
    { key: 'confirmed', label: 'Order Confirmed', icon: FiCheck },
    { key: 'preparing', label: 'Preparing', icon: FiCoffee },
    { key: 'ready', label: 'Ready for Pickup', icon: FiSmile },
  ]

  const currentIndex = steps.findIndex(s => s.key === status)

  return (
    <div className="relative">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center mb-6 last:mb-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
            idx <= currentIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            <step.icon className="h-5 w-5" />
          </div>
          <div className="ml-4">
            <h3 className={`font-medium ${idx <= currentIndex ? 'text-gray-900' : 'text-gray-500'}`}>
              {step.label}
            </h3>
            {idx === currentIndex && status === 'confirmed' && estimatedWaitTime && (
              <p className="text-sm text-blue-600">Estimated: {estimatedWaitTime} minutes</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderStatus