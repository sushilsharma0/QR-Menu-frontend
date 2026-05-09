import React, { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { AuthContext } from '../../../context/AuthContext'

const fmtMoney = (value) => Number(value || 0).toLocaleString()
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : '-')

const emptyRows = (count) =>
  Array.from({ length: count }, (_, index) => ({
    key: `empty-${index}`,
    blank: true,
  }))

const PrintableInvoice = ({ invoice, company }) => {
  const order = invoice?.orderId || {}
  const items = order.items || []
  const tableRows = [...items, ...emptyRows(Math.max(6, 9 - items.length))]
  const taxRate =
    Number(invoice?.subtotal || 0) > 0 ? ((Number(invoice.tax || 0) / Number(invoice.subtotal || 1)) * 100).toFixed(2) : '0.00'

  return (
    <div className="invoice-preview-shell overflow-x-auto bg-gray-500/10 p-4 print:overflow-visible print:bg-white print:p-0">
      <style>{`
        .invoice-page {
          box-sizing: border-box;
          width: 190mm;
          min-height: 260mm;
          color: #000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .invoice-table-fixed {
          table-layout: fixed;
        }
        .invoice-table-fixed td,
        .invoice-table-fixed th {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            background: #fff !important;
            overflow: hidden !important;
          }
          body * { visibility: hidden !important; }
          .invoice-print-area, .invoice-print-area * { visibility: visible !important; }
          .invoice-preview-shell {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            overflow: hidden !important;
          }
          .invoice-print-area {
            position: static !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            overflow: hidden !important;
          }
          .invoice-page {
            width: 190mm !important;
            min-height: auto !important;
            height: 277mm !important;
            margin: 0 auto !important;
            border: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            overflow: hidden !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="invoice-print-area mx-auto w-fit">
        <div className="invoice-page mx-auto border border-gray-300 bg-white px-7 py-7 text-[10px] leading-tight shadow-sm print:px-0 print:py-0 print:text-[8.5px] print:shadow-none">
        <div className="flex items-start justify-between gap-8">
          <div className="w-[78mm] min-w-0">
            <h2 className="break-words text-sm font-bold">[{company.name || 'Company Name'}]</h2>
            <p>{company.address || '[Street Address]'}</p>
            <p>{company.city || '[City, ST ZIP]'}</p>
            <p>Phone: {company.phone || '[000-000-0000]'}</p>
            <p>Fax: {company.fax || '[000-000-0000]'}</p>
            <p>Website: {company.website || '-'}</p>
          </div>

          <div className="w-[55mm] shrink-0 text-right">
            <h1 className="text-3xl font-bold leading-none tracking-wide text-[#7894ce]">INVOICE</h1>
            <table className="ml-auto mt-2 text-[9px]">
              <tbody>
                <tr>
                  <td className="pr-3 text-right font-bold">DATE</td>
                  <td className="w-20 border border-gray-400 px-2 py-1 text-center">{fmtDate(invoice.issuedAt)}</td>
                </tr>
                <tr>
                  <td className="pr-3 text-right font-bold">INVOICE #</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="pr-3 text-right font-bold">CUSTOMER ID</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{invoice.customerId || order.guestId || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-12 print:mt-5">
          <div>
            <div className="bg-[#3f4f86] px-2 py-1 text-xs font-bold text-white">BILL TO:</div>
            <div className="mt-1 min-h-[62px] print:min-h-[48px]">
              <p>{invoice.customerName || order.customerName || '[Name]'}</p>
              <p>{order.customerEmail || '[Company Name]'}</p>
              <p>{order.customerPhone || '[Street Address]'}</p>
              <p>[City, ST ZIP]</p>
              <p>{order.customerPhone || '[Phone]'}</p>
            </div>
          </div>
          <div>
            <div className="bg-[#3f4f86] px-2 py-1 text-xs font-bold text-white">SHIP TO:</div>
            <div className="mt-1 min-h-[62px] print:min-h-[48px]">
              <p>{invoice.customerName || order.customerName || '[Name]'}</p>
              <p>{company.name || '[Company Name]'}</p>
              <p>Table {order.table?.tableNumber || order.table || '-'}</p>
              <p>{order.orderChannel || 'dine_in'}</p>
              <p>{order.customerPhone || '[Phone]'}</p>
            </div>
          </div>
        </div>

        <table className="invoice-table-fixed mt-4 w-full border-collapse text-center text-[9px] print:mt-3 print:text-[8px]">
          <thead>
            <tr className="bg-[#3f4f86] font-bold text-white">
              <th className="border border-[#3f4f86] px-2 py-1">SALESPERSON</th>
              <th className="border border-[#3f4f86] px-2 py-1">P.O. #</th>
              <th className="border border-[#3f4f86] px-2 py-1">SHIP DATE</th>
              <th className="border border-[#3f4f86] px-2 py-1">SHIP VIA</th>
              <th className="border border-[#3f4f86] px-2 py-1">F.O.B.</th>
              <th className="border border-[#3f4f86] px-2 py-1">TERMS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="h-6 border border-black px-2">{invoice.waiterName || '-'}</td>
              <td className="border border-black px-2">{order.orderNumber || '-'}</td>
              <td className="border border-black px-2">{fmtDate(order.createdAt || invoice.issuedAt)}</td>
              <td className="border border-black px-2">{order.orderChannel || 'dine_in'}</td>
              <td className="border border-black px-2">-</td>
              <td className="border border-black px-2 capitalize">{invoice.paymentStatus || 'pending'}</td>
            </tr>
          </tbody>
        </table>

        <table className="invoice-table-fixed mt-4 w-full border-collapse text-[9px] print:mt-3 print:text-[8px]">
          <thead>
            <tr className="bg-[#3f4f86] text-center font-bold text-white">
              <th className="w-[19%] border border-black px-2 py-1">ITEM #</th>
              <th className="border border-black px-2 py-1">DESCRIPTION</th>
              <th className="w-[10%] border border-black px-2 py-1">QTY</th>
              <th className="w-[14%] border border-black px-2 py-1">UNIT PRICE</th>
              <th className="w-[14%] border border-black px-2 py-1">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((item, index) => {
              const qty = Number(item.quantity || 0)
              const price = Number(item.price || 0)
              return (
                <tr key={item._id || item.key || index} className="h-4 print:h-[13px]">
                  <td className="border border-black px-2">{item.blank ? '' : item.menuItem || `[${index + 1}]`}</td>
                  <td className="border border-black px-2">{item.blank ? '' : item.name}</td>
                  <td className="border border-black px-2 text-center">{item.blank ? '' : qty}</td>
                  <td className="border border-black px-2 text-right">{item.blank ? '' : price.toFixed(2)}</td>
                  <td className="border border-black px-2 text-right">{item.blank ? '-' : (qty * price).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-[1fr_44mm] gap-6 print:mt-3">
          <div>
            <div className="bg-gray-300 px-2 py-1 font-bold">Other Comments or Special Instructions</div>
            <div className="min-h-[64px] border border-gray-300 px-2 py-2 print:min-h-[48px] print:py-1">
              <p>1. Total payment due in 30 days</p>
              <p>2. Please include the invoice number on your check</p>
              {order.specialRequests && <p>3. {order.specialRequests}</p>}
            </div>
          </div>
          <table className="w-full border-collapse text-[9px]">
            <tbody>
              <tr>
                <td className="py-1 text-right font-bold">SUBTOTAL</td>
                <td className="w-24 border border-gray-400 px-2 text-right">{fmtMoney(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold">TAX RATE</td>
                <td className="border border-gray-400 px-2 text-right">{taxRate}%</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold">TAX</td>
                <td className="border border-gray-400 px-2 text-right">{fmtMoney(invoice.tax)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold">S & H</td>
                <td className="border border-gray-400 px-2 text-right">{fmtMoney(invoice.serviceCharge)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold">OTHER</td>
                <td className="border border-gray-400 px-2 text-right">-</td>
              </tr>
              <tr className="bg-[#3f4f86] text-white">
                <td className="py-1 text-right font-bold">TOTAL</td>
                <td className="border border-[#3f4f86] px-2 text-right font-bold">Rs. {fmtMoney(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 text-center text-[9px] print:mt-4 print:text-[8px]">
          <p>Make all checks payable to</p>
          <p className="font-bold">[{company.name || 'Your Company Name'}]</p>
          <p className="mt-5 print:mt-3">If you have any questions about this invoice, please contact</p>
          <p>{company.contact || `${company.phone || 'Name, Phone #'}, ${company.email || 'E-mail'}`}</p>
          <p className="mt-1 text-base italic">Thank You For Your Business!</p>
        </div>
        </div>
      </div>
    </div>
  )
}

const Invoices = () => {
  const { user } = useContext(AuthContext)
  const [orderId, setOrderId] = useState('')
  const [rows, setRows] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState('')
  const [generating, setGenerating] = useState(false)

  const company = useMemo(
    () => ({
      name: user?.restaurantName || user?.name,
      address: user?.address,
      city: [user?.city, user?.state, user?.pincode].filter(Boolean).join(', '),
      phone: user?.phone,
      fax: user?.fax,
      website: user?.website,
      email: user?.email,
    }),
    [user],
  )

  const load = async () => {
    try {
      const res = await api.get('/restaurant/invoices')
      setRows(res.data?.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load invoices')
    }
  }

  useEffect(() => { load() }, [])

  const openPreview = async (row) => {
    try {
      setLoadingPreviewId(row._id)
      const res = await api.get(`/restaurant/invoices/${row._id}`)
      setSelectedInvoice(res.data?.data || row)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to open invoice')
    } finally {
      setLoadingPreviewId('')
    }
  }

  const generate = async (e) => {
    e.preventDefault()
    if (!orderId.trim()) {
      toast.error('Order ID or order number is required')
      return
    }
    try {
      setGenerating(true)
      const res = await api.post('/restaurant/invoices', { orderId: orderId.trim() })
      setOrderId('')
      toast.success('Invoice generated')
      await load()
      if (res.data?.data?._id) await openPreview(res.data.data)
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to generate invoice')
    } finally {
      setGenerating(false)
    }
  }

  const printInvoice = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-black">Invoices & Receipts</h1>
        {selectedInvoice && (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setSelectedInvoice(null)}>Close Preview</Button>
            <Button type="button" onClick={printInvoice}>Print Invoice</Button>
          </div>
        )}
      </div>

      <div className="no-print">
        <Card title="Generate invoice from order">
          <form onSubmit={generate} className="flex flex-wrap items-end gap-3">
            <Input label="Order ID or Order #" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Button type="submit" loading={generating}>Generate Invoice</Button>
          </form>
        </Card>
      </div>

      {selectedInvoice && <PrintableInvoice invoice={selectedInvoice} company={company} />}

      <div className="no-print">
        <Card title="Invoice history">
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row._id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-semibold">{row.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(row.issuedAt).toLocaleString()} | {row.paymentMethod} | {row.paymentStatus}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary-700">Rs. {fmtMoney(row.total)}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={loadingPreviewId === row._id}
                    onClick={() => openPreview(row)}
                  >
                    View / Print
                  </Button>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm text-gray-500">No invoices yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Invoices
