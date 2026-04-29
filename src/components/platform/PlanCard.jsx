import React from 'react'
import { FiCheck } from 'react-icons/fi'
import Card from '../common/Card'
import Button from '../common/Button'

const PlanCard = ({ plan, onEdit, onDelete }) => {
  return (
    <Card className={`${plan.isPopular ? 'border-2 border-primary-500 relative' : ''}`}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs">
          Most Popular
        </div>
      )}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500">{plan.durationLabel}</p>
        <p className="text-3xl font-bold text-primary-600 mt-2">${plan.price}</p>
      </div>
      <div className="space-y-2 mb-6">
        {plan.features?.slice(0, 5).map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <FiCheck className="text-green-500 flex-shrink-0" />
            <span className="text-gray-600">{feature}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(plan)}>Edit</Button>
        <Button size="sm" variant="danger" className="flex-1" onClick={() => onDelete(plan)}>Delete</Button>
      </div>
    </Card>
  )
}

export default PlanCard