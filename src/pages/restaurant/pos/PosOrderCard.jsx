import React from 'react'
import {
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiUser,
} from 'react-icons/fi'

const statusTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  preparing: 'bg-violet-50 text-violet-700 border-violet-200',
  cooking: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  served: 'bg-slate-50 text-slate-700 border-slate-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const paymentTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

function Pill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${className}`}>
      {children}
    </span>
  )
}

export function getCustomerDisplayName(order) {
  const name = String(order?.customerName || '').trim()
  const genericNames = new Set(['guest', 'qr customer', 'guest user'])
  if (name && !genericNames.has(name.toLowerCase())) return name
  if (order?.customerPhone) return order.customerPhone
  if (order?.customerEmail) return order.customerEmail
  if (order?.guestId) return order.guestId
  return 'Walk-in Guest'
}

export default function PosOrderCard({
  order,
  source,
  selected = false,
  onSelect,
  action,
  id,
}) {
  if (!order) return null
  const items = Array.isArray(order.items) ? order.items : []
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const createdAt = order.createdAt ? new Date(order.createdAt) : null
  const Wrapper = onSelect ? 'button' : 'article'

  return (
    <Wrapper
      id={id || `pos-order-${order._id}`}
      type={onSelect ? 'button' : undefined}
      onClick={onSelect ? () => onSelect(order) : undefined}
      className={`w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        selected ? 'border-primary-500 bg-primary-50/60' : 'border-surface-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-gray-950">#{order.orderNumber}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill className={statusTone[order.status] || statusTone.pending}>{order.status}</Pill>
            <Pill className={paymentTone[order.paymentStatus] || paymentTone.pending}>{order.paymentStatus}</Pill>
            <Pill className="border-surface-200 bg-surface-50 text-gray-600">{order.orderChannel}</Pill>
            {source && <Pill className="border-primary-100 bg-primary-50 text-primary-700">{source}</Pill>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-primary-700">Rs. {order.grandTotal}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2">
          <FiMapPin className="h-4 w-4 text-primary-700" />
          <span className="truncate">Table {order.table?.tableNumber || '-'}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2">
          <FiUser className="h-4 w-4 text-primary-700" />
          <span className="truncate">{getCustomerDisplayName(order)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2">
          <FiClock className="h-4 w-4 text-primary-700" />
          <span className="truncate">{createdAt ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-surface-100 bg-surface-50/70 p-3">
        <div className="space-y-2">
          {items.slice(0, 4).map((item, idx) => (
            <div key={`${item.menuItem || item.name}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-bold leading-tight text-gray-900">
                  {item.quantity}x {item.name}
                </p>
                {(item.specialInstructions || item.cookingInstructions) && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {item.specialInstructions || item.cookingInstructions}
                  </p>
                )}
                {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {item.customizations.map((c) => `${c.name}: ${c.value}`).join(', ')}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-black text-primary-700">Rs. {item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0)}</span>
            </div>
          ))}
          {items.length > 4 && (
            <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-500">
              +{items.length - 4} more item{items.length - 4 === 1 ? '' : 's'}
            </p>
          )}
          {!items.length && <p className="text-sm text-gray-500">No item details available.</p>}
        </div>
      </div>

      {(order.specialRequests || order.customerPhone) && (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {order.customerPhone && <span className="font-bold">Phone: {order.customerPhone}</span>}
          {order.customerPhone && order.specialRequests && <span className="mx-2">-</span>}
          {order.specialRequests && <span>{order.specialRequests}</span>}
        </div>
      )}

      {action && <div className="mt-4 flex justify-end">{action}</div>}
    </Wrapper>
  )
}
