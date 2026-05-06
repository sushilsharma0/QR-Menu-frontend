import React from 'react'
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'

const Cart = ({
  items,
  currency = 'Rs.',
  onIncrease,
  onDecrease,
  onRemove,
  total,
  onSubmit,
  submitting = false,
  disabled = false,
}) => {
  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-primary-900">Current Order</h3>
        <span className="text-sm text-accent-700">{items.length} items</span>
      </div>

      <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
        {items.length === 0 && (
          <p className="text-sm text-accent-700">No items selected yet.</p>
        )}

        {items.map((item) => (
          <div key={item._id} className="border border-surface-200 rounded-xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary-900">{item.name}</p>
                <p className="text-xs text-accent-700">
                  {currency}
                  {item.price} each
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item._id)}
                className="text-secondary-600 hover:text-primary-600"
              >
                <FiTrash2 />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="inline-flex items-center rounded-lg border border-surface-300">
                <button type="button" className="px-2 py-1" onClick={() => onDecrease(item._id)}>
                  <FiMinus />
                </button>
                <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                <button type="button" className="px-2 py-1" onClick={() => onIncrease(item._id)}>
                  <FiPlus />
                </button>
              </div>
              <p className="text-sm font-semibold text-primary-900">
                {currency}
                {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-surface-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-accent-800">Total</span>
          <span className="text-xl font-bold text-primary-700">
            {currency}
            {total.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          disabled={disabled || items.length === 0 || submitting}
          onClick={onSubmit}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending to kitchen...' : 'Send Order to Kitchen'}
        </button>
      </div>
    </div>
  )
}

export default Cart
