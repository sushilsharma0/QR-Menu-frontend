import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

const Invoices = () => {
  const [orderId, setOrderId] = useState('')
  const [rows, setRows] = useState([])

  const load = async () => {
    try {
      const res = await api.get('/restaurant/invoices')
      setRows(res.data?.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load invoices')
    }
  }
  useEffect(() => { load() }, [])

  const generate = async (e) => {
    e.preventDefault()
    if (!orderId.trim()) {
      toast.error('Order ID is required')
      return
    }
    try {
      await api.post('/restaurant/invoices', { orderId: orderId.trim() })
      setOrderId('')
      toast.success('Invoice generated')
      load()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to generate invoice')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Invoices & Receipts</h1>

      <Card title="Generate invoice from order">
        <form onSubmit={generate} className="flex flex-wrap items-end gap-3">
          <Input label="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          <Button type="submit">Generate Invoice</Button>
        </form>
      </Card>

      <Card title="Invoice history">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row._id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-semibold">{row.invoiceNumber}</p>
                <p className="text-xs text-gray-500">
                  {new Date(row.issuedAt).toLocaleString()} • {row.paymentMethod} • {row.paymentStatus}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary-700">Rs. {Number(row.total || 0).toLocaleString()}</span>
                <a href={`/api/restaurant/invoices/download/${row._id}`} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="secondary">Download</Button>
                </a>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-gray-500">No invoices yet.</p>}
        </div>
      </Card>
    </div>
  )
}

export default Invoices
