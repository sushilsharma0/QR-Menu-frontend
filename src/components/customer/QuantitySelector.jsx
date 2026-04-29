import React, { useState } from 'react'
import { FiPlus, FiMinus } from 'react-icons/fi'
import Button from '../common/Button'

const QuantitySelector = ({ initialQuantity = 1, onAdd, maxQuantity = 10 }) => {
  const [quantity, setQuantity] = useState(initialQuantity)

  const handleAdd = () => {
    onAdd(quantity)
    setQuantity(1)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <FiMinus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
          disabled={quantity >= maxQuantity}
          className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <FiPlus className="h-3 w-3" />
        </button>
      </div>
      <Button size="sm" onClick={handleAdd}>Add to Cart</Button>
    </div>
  )
}

export default QuantitySelector