import React from 'react'
import { FiCheck } from 'react-icons/fi'
import Card from '../common/Card'
import Button from '../common/Button'

const PlanCard = ({ plan, onEdit, onDelete }) => {
  const limitRows = [
    { key: 'Tables', value: plan?.limits?.maxTables },
    { key: 'Employees', value: plan?.limits?.maxEmployees },
    { key: 'Categories', value: plan?.limits?.maxCategories },
    { key: 'Menu Items', value: plan?.limits?.maxMenuItems },
  ]

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

      <div className="mb-6 border rounded-lg p-3 bg-gray-50">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Limits</p>
        <div className="space-y-1.5">
          {limitRows.map((row) => {
            const value = Number(row.value ?? 0)
            return (
              <div key={row.key} className="flex justify-between text-sm">
                <span className="text-gray-600">{row.key}</span>
                <span className="font-medium text-gray-900">{value <= 0 ? 'Unlimited' : value}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(plan)}>Edit</Button>
        <Button size="sm" variant="danger" className="flex-1" onClick={() => onDelete(plan)}>Delete</Button>
      </div>
    </Card>
  )
}

export default PlanCard