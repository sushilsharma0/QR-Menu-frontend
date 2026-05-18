import React, { useEffect, useMemo, useState } from 'react'
import { FiAlertTriangle, FiArrowLeft, FiBarChart2, FiBox, FiClock, FiCreditCard, FiDownload, FiEdit2, FiMapPin, FiPieChart, FiPlus, FiRefreshCw, FiShoppingBag, FiTrash2, FiUsers } from 'react-icons/fi'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { useBranch } from '../../context/BranchContext'
import { money } from './finance/FinanceUI'

const OTP_RESEND_COOLDOWN_SEC = 60

const MODULE_DEFS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'menu', label: 'Menu' },
  { key: 'tables', label: 'Tables' },
  { key: 'pos', label: 'POS' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'employees', label: 'Staff' },
]

const CHART_COLORS = ['#8f2800', '#14b8a6', '#7c3aed', '#f97316', '#0f766e', '#dc2626', '#64748b', '#ca8a04']

const prettyLabel = (value) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const asArray = (value) => (Array.isArray(value) ? value : [])

const percent = (value) => `${Number(value || 0).toFixed(1)}%`

const ratioPercent = (part, total) => {
  const t = Number(total || 0)
  if (!t) return 0
  return (Number(part || 0) / t) * 100
}

const safeText = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const safeFileName = (value) =>
  String(value || 'branch-report')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'branch-report'

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function makeReportModel(sourceAnalytics = {}) {
  const breakdowns = sourceAnalytics.breakdowns || {}
  const summary = sourceAnalytics.summary || {}
  const revenue = Number(summary.revenue || 0)
  const expenses = Number(summary.expenses || 0)
  const netProfit = Number(summary.netProfit || revenue - expenses)
  return {
    financeBridge: [
      { name: 'Revenue', amount: revenue },
      { name: 'Expenses', amount: expenses },
      { name: 'Net Profit', amount: netProfit },
    ],
    trends: asArray(sourceAnalytics.trends).map((row) => ({
      date: row._id,
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    })),
    status: asArray(breakdowns.status).map((row) => ({
      name: prettyLabel(row._id),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
    })),
    payment: asArray(breakdowns.payment).map((row) => ({
      name: prettyLabel(row._id),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
    })),
    channel: asArray(breakdowns.channel).map((row) => ({
      name: prettyLabel(row._id),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
    })),
    hourly: asArray(breakdowns.hourly).map((row) => ({
      hour: `${String(row._id).padStart(2, '0')}:00`,
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
    })),
    topItems: asArray(breakdowns.topItems).map((row) => ({
      name: row._id || 'Item',
      quantity: Number(row.quantity || 0),
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    })),
    expenseCategories: asArray(breakdowns.expenseCategories).map((row) => ({
      name: prettyLabel(row._id),
      amount: Number(row.amount || 0),
      entries: Number(row.entries || 0),
    })),
    inventoryCategories: asArray(breakdowns.inventoryCategories).map((row) => ({
      name: prettyLabel(row._id),
      value: Number(row.value || 0),
      items: Number(row.items || 0),
    })),
    lowStockItems: asArray(breakdowns.lowStockItems).map((item) => ({
      ...item,
      stockGap: Math.max(0, Number(item.minimumStock || 0) - Number(item.quantity || 0)),
      stockValue: Number(item.quantity || 0) * Number(item.costPerUnit || 0),
    })),
    recentOrders: asArray(breakdowns.recentOrders),
  }
}

function pdfEscape(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
}

function wrapPdfLine(value, max = 95) {
  const words = String(value ?? '').split(/\s+/)
  const lines = []
  let line = ''
  words.forEach((word) => {
    if (!word) return
    if ((line ? `${line} ${word}` : word).length > max) {
      if (line) lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  })
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function downloadPdfFromLines(lines, filename) {
  const pageWidth = 595
  const pageHeight = 842
  const marginX = 44
  const startY = 792
  const lineHeight = 14
  const maxLines = Math.floor((startY - 54) / lineHeight)
  const pages = []
  let current = []

  lines.forEach((line) => {
    const wrapped = wrapPdfLine(line, 92)
    wrapped.forEach((entry) => {
      if (current.length >= maxLines) {
        pages.push(current)
        current = []
      }
      current.push(entry)
    })
  })
  if (current.length) pages.push(current)
  if (!pages.length) pages.push(['No report data.'])

  const objects = []
  const addObject = (body) => {
    objects.push(body)
    return objects.length
  }
  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>')
  const pagesId = addObject('')
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const pageIds = []

  pages.forEach((pageLines, pageIndex) => {
    const content = [
      'BT',
      '/F1 10 Tf',
      '12 TL',
      `1 0 0 1 ${marginX} ${startY} Tm`,
      ...pageLines.map((line, index) => {
        const prefix = index === 0 ? '' : 'T* '
        return `${prefix}(${pdfEscape(line)}) Tj`
      }),
      'ET',
      'BT /F1 8 Tf 1 0 0 1 44 28 Tm',
      `(Page ${pageIndex + 1} of ${pages.length}) Tj`,
      'ET',
    ].join('\n')
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  })

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((body, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function buildBranchReportLines({ branch, analytics, report, activity, enabledModules }) {
  const summary = analytics.summary || {}
  const customerOrders = Number(summary.customerOrders || summary.totalOrders || 0)
  const revenue = Number(summary.revenue || 0)
  const expenses = Number(summary.expenses || 0)
  const netProfit = Number(summary.netProfit || 0)
  const topItem = report.topItems[0]
  const busiestHour = [...report.hourly].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0]
  const paidRow = report.payment.find((row) => row.name.toLowerCase() === 'paid')
  const paidOrders = Number(paidRow?.orders || 0)
  const lines = []
  const addSection = (title) => {
    lines.push('')
    lines.push(title.toUpperCase())
    lines.push('-'.repeat(Math.min(title.length, 70)))
  }
  const addRow = (label, value) => lines.push(`${label}: ${safeText(value)}`)
  const addRows = (rows, formatter, emptyText = 'No records.') => {
    if (!rows.length) {
      lines.push(emptyText)
      return
    }
    rows.forEach((row, index) => lines.push(`${index + 1}. ${formatter(row)}`))
  }

  lines.push('==========================================')
  lines.push('QR MENU SAAS - BRANCH FULL REPORT')
  lines.push('==========================================')
  lines.push(`Generated: ${formatDateTime(new Date())}`)
  lines.push(`Branch: ${safeText(branch?.name)}`)
  lines.push(`Status: ${safeText(prettyLabel(branch?.status))}`)

  addSection('Executive Summary')
  addRow('Total revenue', money(revenue))
  addRow('Total expenses', money(expenses))
  addRow('Net profit', money(netProfit))
  addRow('Profit margin', percent(ratioPercent(netProfit, revenue)))
  addRow('Order count', customerOrders)
  addRow('Paid order rate', percent(ratioPercent(paidOrders, customerOrders)))
  addRow('Top item', topItem ? `${topItem.name} (${money(topItem.revenue)})` : '-')
  addRow('Busiest hour', busiestHour ? `${busiestHour.hour} (${busiestHour.orders} orders)` : '-')
  addRow('Low stock pressure', `${summary.lowStockItems || 0} item(s)`)

  addSection('Branch Details')
  addRow('Public ID', branch?.publicBranchId || branch?._id)
  addRow('Slug', branch?.slug)
  addRow('Manager', branch?.branchManagerName)
  addRow('Phone', branch?.phone)
  addRow('Tax number', branch?.taxNumber)
  addRow('Address', branch?.address)
  addRow('City', branch?.city)
  addRow('State', branch?.state)
  addRow('Country', branch?.country)

  addSection('Performance Summary')
  addRow('Revenue', money(summary.revenue))
  addRow('Expenses', money(summary.expenses))
  addRow('Net profit', money(summary.netProfit))
  addRow('Profit margin', percent(ratioPercent(summary.netProfit, summary.revenue)))
  addRow('Expense ratio', percent(ratioPercent(summary.expenses, summary.revenue)))
  addRow('Paid order rate', percent(ratioPercent(paidOrders, customerOrders)))
  addRow('Average order value', money(summary.averageOrderValue))
  addRow('Customer orders', summary.customerOrders || summary.totalOrders || 0)
  addRow('Sales orders', summary.salesOrders || 0)
  addRow('Employees', summary.employees || 0)
  addRow('Inventory value', money(summary.inventoryValue))
  addRow('Inventory items', summary.inventoryItems || 0)
  addRow('Low stock items', summary.lowStockItems || 0)
  addRow('Expense entries', summary.expenseEntries || 0)

  addSection('Enabled Modules')
  lines.push((enabledModules || []).join(', ') || 'No modules enabled.')

  addSection('Revenue And Orders Trend')
  addRows(report.trends, (row) => `${row.date} | Revenue ${money(row.revenue)} | Orders ${row.orders}`)

  addSection('Order Status Breakdown')
  addRows(report.status, (row) => `${row.name} | Orders ${row.orders} | Value ${money(row.revenue)}`)

  addSection('Payment Status Breakdown')
  addRows(report.payment, (row) => `${row.name} | Orders ${row.orders} | Value ${money(row.revenue)}`)

  addSection('Order Channels')
  addRows(report.channel, (row) => `${row.name} | Orders ${row.orders} | Value ${money(row.revenue)}`)

  addSection('Hourly Demand')
  addRows(report.hourly, (row) => `${row.hour} | Orders ${row.orders} | Value ${money(row.revenue)}`)

  addSection('Top Selling Items')
  addRows(report.topItems, (row) => `${row.name} | Qty ${row.quantity} | Revenue ${money(row.revenue)} | Lines ${row.orders}`)

  addSection('Expense Categories')
  addRows(report.expenseCategories, (row) => `${row.name} | Amount ${money(row.amount)} | Entries ${row.entries}`)

  addSection('Inventory Categories')
  addRows(report.inventoryCategories, (row) => `${row.name} | Value ${money(row.value)} | Items ${row.items}`)

  addSection('Recent Orders')
  addRows(report.recentOrders, (order) => `#${order.orderNumber} | ${safeText(order.customerName || 'Guest')} | ${prettyLabel(order.status)} | ${prettyLabel(order.paymentStatus)} | ${money(order.grandTotal)} | ${formatDateTime(order.createdAt)}`)

  addSection('Low Stock Watch')
  addRows(report.lowStockItems, (item) => `${safeText(item.name)} | ${prettyLabel(item.category)} | Qty ${safeText(item.quantity)} ${safeText(item.unit)} | Min ${safeText(item.minimumStock)} | Value ${money(Number(item.quantity || 0) * Number(item.costPerUnit || 0))}`)

  addSection('Branch Activity')
  addRows(activity || [], (row) => `${safeText(row.action)} | ${formatDateTime(row.timestamp)} | ${safeText(row.ipAddress)}`)

  return lines
}

const emptyForm = {
  name: '',
  branchCode: '',
  branchManagerName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'Nepal',
  status: 'active',
  taxNumber: '',
  branchUsername: '',
  branchPassword: '',
  autoGeneratePassword: true,
  ownerEmail: '',
  ownerOtp: '',
  enabledModules: {},
}

function BranchEditForm({ initial, onSubmit, onClose, saving }) {
  const [form, setForm] = useState(() => {
    const base = { ...emptyForm, ...(initial || {}) }
    if (initial?.enabledModules && typeof initial.enabledModules === 'object') {
      base.enabledModules = { ...initial.enabledModules }
    }
    return base
  })
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const toggleModule = (key) => () =>
    setForm((current) => {
      const prev = current.enabledModules?.[key]
      const on = prev === false ? false : true
      return {
        ...current,
        enabledModules: { ...current.enabledModules, [key]: !on },
      }
    })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Branch name" value={form.name} onChange={set('name')} required />
        <Input label="Branch code (optional)" value={form.branchCode} onChange={set('branchCode')} disabled placeholder="Auto if empty" />
        <Input label="Branch manager name" value={form.branchManagerName || ''} onChange={set('branchManagerName')} />
        <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
        <Input label="City" value={form.city || ''} onChange={set('city')} />
        <Input label="State" value={form.state || ''} onChange={set('state')} />
        <Input label="Country" value={form.country || ''} onChange={set('country')} />
        <Input label="Tax number" value={form.taxNumber || ''} onChange={set('taxNumber')} />
      </div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        Status
        <select
          value={form.status}
          onChange={set('status')}
          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Enabled modules (branch portal)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MODULE_DEFS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={form.enabledModules?.[key] !== false}
                onChange={toggleModule(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        Address
        <textarea
          value={form.address || ''}
          onChange={set('address')}
          rows={3}
          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>Save branch</Button>
      </div>
    </form>
  )
}

function CreateBranchWizard({
  form,
  setForm,
  step,
  onStepBack,
  saving,
  otpSending,
  verifySending,
  resendCooldown,
  devOtpHint,
  otpExpiresMinutes,
  onRequestOwnerOtp,
  onVerifyOtp,
  onSubmitCreate,
  onClose,
}) {
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const toggleModule = (key) => () =>
    setForm((current) => {
      const prev = current.enabledModules?.[key]
      const on = prev === false ? false : true
      return {
        ...current,
        enabledModules: { ...current.enabledModules, [key]: !on },
      }
    })

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-amber-50 px-4 py-4 shadow-sm dark:border-primary-900/50 dark:from-primary-950/30 dark:via-gray-900 dark:to-gray-900">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-md shadow-primary-900/20">1</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-primary-800 dark:text-primary-200">Step 1 / 2 - Verify owner</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Branch basics and Gmail verification</p>
            </div>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Enter branch basics and the owner&apos;s Gmail. We send a one-time code to that inbox (check spam). After you verify the code, step 2 opens for portal login, address, and modules.
          </p>
        </div>
        {devOtpHint ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>Development only:</strong> SMTP is not configured on the server. Your verification code is{' '}
            <span className="font-mono text-lg font-black tracking-widest">{devOtpHint}</span>
            . In production, configure <span className="font-mono">SMTP_USER</span> and <span className="font-mono">SMTP_PASS</span>.
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Branch name" value={form.name} onChange={set('name')} required />
          <Input label="Branch code (optional)" value={form.branchCode} onChange={set('branchCode')} placeholder="Auto if empty" />
          <div className="md:col-span-2">
            <Input label="Branch manager name" value={form.branchManagerName || ''} onChange={set('branchManagerName')} />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Branch owner Gmail (@gmail.com)"
              type="email"
              value={form.ownerEmail || ''}
              onChange={set('ownerEmail')}
              placeholder="owner@gmail.com"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              label="Verification code from Gmail"
              value={form.ownerOtp || ''}
              onChange={set('ownerOtp')}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            loading={otpSending}
            disabled={resendCooldown > 0 && !otpSending}
            onClick={() => onRequestOwnerOtp(form.ownerEmail)}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send code'}
          </Button>
          <Button
            type="button"
            className="shrink-0"
            loading={verifySending}
            onClick={onVerifyOtp}
          >
            Verify code
          </Button>
        </div>
        {otpExpiresMinutes != null && otpExpiresMinutes > 0 && !devOtpHint ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each code is valid for about {otpExpiresMinutes} minutes. You can resend after the timer on the button.
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmitCreate()
      }}
    >
      <div className="rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50 p-4 text-sm shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-800/50">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-md shadow-primary-900/20">2</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Step 2 / 2 - Branch details</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Owner Gmail is already verified. Finish portal access, contact info, and modules below.</p>
          </div>
        </div>
        <p className="mt-3 font-bold text-gray-900 dark:text-gray-100">Summary from step 1</p>
        <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300">
          <li><span className="font-semibold">Branch:</span> {form.name || '—'}</li>
          {form.branchCode && <li><span className="font-semibold">Code:</span> {form.branchCode}</li>}
          {form.branchManagerName && <li><span className="font-semibold">Manager:</span> {form.branchManagerName}</li>}
          <li><span className="font-semibold">Owner Gmail:</span> {form.ownerEmail || '—'}</li>
        </ul>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onStepBack}>
          <FiArrowLeft className="mr-1 inline h-4 w-4" />
          Back to step 1
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Custom branch username" value={form.branchUsername} onChange={set('branchUsername')} placeholder="e.g. pokhara (becomes …@branch.com)" />
        <label className="flex items-center gap-2 self-end text-sm font-semibold text-gray-700 dark:text-gray-200 md:pb-2">
          <input
            type="checkbox"
            checked={Boolean(form.autoGeneratePassword)}
            onChange={(e) => setForm((c) => ({ ...c, autoGeneratePassword: e.target.checked }))}
          />
          Auto-generate secure password
        </label>
        {!form.autoGeneratePassword && (
          <div className="md:col-span-2">
            <Input label="Branch password" type="password" value={form.branchPassword} onChange={set('branchPassword')} />
          </div>
        )}
        <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
        <Input label="City" value={form.city || ''} onChange={set('city')} />
        <Input label="State" value={form.state || ''} onChange={set('state')} />
        <Input label="Country" value={form.country || ''} onChange={set('country')} />
        <Input label="Tax number" value={form.taxNumber || ''} onChange={set('taxNumber')} />
      </div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        Status
        <select
          value={form.status}
          onChange={set('status')}
          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Enabled modules (branch portal)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MODULE_DEFS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={form.enabledModules?.[key] !== false}
                onChange={toggleModule(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        Address
        <textarea
          value={form.address || ''}
          onChange={set('address')}
          rows={3}
          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>Create branch</Button>
      </div>
    </form>
  )
}

const Branches = () => {
  const { branches, reloadBranches, selectedBranch: currentBranch } = useBranch()
  const [reportBranchId, setReportBranchId] = useState('')
  const [modalBranch, setModalBranch] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState({})
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [downloadingBranchId, setDownloadingBranchId] = useState('')

  const [otpSending, setOtpSending] = useState(false)
  const [verifySending, setVerifySending] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [ownerVerifyToken, setOwnerVerifyToken] = useState('')
  const [createForm, setCreateForm] = useState(() => ({ ...emptyForm }))
  const [resendCooldown, setResendCooldown] = useState(0)
  const [devOtpBanner, setDevOtpBanner] = useState(null)
  const [otpExpiryMinutesHint, setOtpExpiryMinutesHint] = useState(null)

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [resendCooldown > 0])

  const resetCreateWizard = () => {
    setCreateStep(1)
    setOwnerVerifyToken('')
    setCreateForm({ ...emptyForm })
    setResendCooldown(0)
    setDevOtpBanner(null)
    setOtpExpiryMinutesHint(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalBranch(null)
    resetCreateWizard()
  }

  const openCreateModal = () => {
    setModalBranch(null)
    resetCreateWizard()
    setModalOpen(true)
  }

  useEffect(() => {
    if (!branches.length) return
    const defaultBranch = branches.find((branch) => branch.isDefault) || branches[0]
    setReportBranchId((current) =>
      current && branches.some((branch) => String(branch._id) === String(current))
        ? current
        : String(defaultBranch._id),
    )
  }, [branches])

  const selectedBranch =
    branches.find((branch) => String(branch._id) === String(reportBranchId)) ||
    branches.find((branch) => branch.isDefault) ||
    branches[0]
  const trendData = useMemo(() => analytics.trends || [], [analytics])
  const canManageBranches = !currentBranch || currentBranch.isDefault
  const enabledModuleList = MODULE_DEFS
    .filter(({ key }) => selectedBranch?.isDefault || selectedBranch?.enabledModules?.[key] !== false)
    .map(({ label }) => label)

  const getEnabledModulesForBranch = (branch) =>
    MODULE_DEFS
      .filter(({ key }) => branch?.isDefault || branch?.enabledModules?.[key] !== false)
      .map(({ label }) => label)

  const loadAnalytics = async (branchId = selectedBranch?._id) => {
    if (!branchId) return
    try {
      setLoadingAnalytics(true)
      const res = await api.get(`/restaurant/branches/${branchId}/analytics`, { skipBranchHeader: true })
      setAnalytics(res.data?.data || {})
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load branch analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [selectedBranch?._id])

  const loadActivity = async (branchId = selectedBranch?._id) => {
    if (!branchId) return
    try {
      setLoadingActivity(true)
      const res = await api.get(`/restaurant/branches/${branchId}/activity`, { skipBranchHeader: true })
      setActivity(res.data?.data?.items || [])
    } catch {
      setActivity([])
    } finally {
      setLoadingActivity(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [selectedBranch?._id])

  const requestOwnerOtp = async (ownerEmail) => {
    const e = String(ownerEmail || '').trim().toLowerCase()
    if (!e) {
      toast.error('Enter the branch owner Gmail first.')
      return
    }
    if (!e.endsWith('@gmail.com') && !e.endsWith('@googlemail.com')) {
      toast.error('Branch owner email must be a Gmail address (@gmail.com).')
      return
    }
    try {
      setOtpSending(true)
      const res = await api.post('/restaurant/branches/owner-email/request-otp', { ownerEmail: e }, { skipBranchHeader: true })
      const data = res.data?.data || {}
      setResendCooldown(OTP_RESEND_COOLDOWN_SEC)
      setOtpExpiryMinutesHint(typeof data.expiresInMinutes === 'number' ? data.expiresInMinutes : 10)
      if (data.devOtp) {
        setDevOtpBanner(String(data.devOtp))
        toast.success('Development mode: SMTP is off — use the code shown in the yellow box.', { duration: 8000 })
      } else {
        setDevOtpBanner(null)
        toast.success(
          `Verification code sent to ${e}. Check inbox and spam. Valid for about ${data.expiresInMinutes ?? 10} minutes.`,
          { duration: 6000 },
        )
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code')
    } finally {
      setOtpSending(false)
    }
  }

  const verifyOwnerOtp = async () => {
    const ownerEmail = String(createForm.ownerEmail || '').trim().toLowerCase()
    const ownerOtp = String(createForm.ownerOtp || '').trim()
    if (!ownerEmail) {
      toast.error('Enter the branch owner Gmail first.')
      return
    }
    if (!ownerOtp) {
      toast.error('Enter the verification code from Gmail.')
      return
    }
    if (!ownerEmail.endsWith('@gmail.com') && !ownerEmail.endsWith('@googlemail.com')) {
      toast.error('Branch owner email must be a Gmail address (@gmail.com).')
      return
    }
    try {
      setVerifySending(true)
      const res = await api.post(
        '/restaurant/branches/owner-email/verify-otp',
        { ownerEmail, ownerOtp },
        { skipBranchHeader: true },
      )
      const tok = res.data?.data?.ownerVerifyToken
      if (!tok) throw new Error('Missing token')
      setOwnerVerifyToken(tok)
      setCreateStep(2)
      setDevOtpBanner(null)
      toast.success('Gmail verified. Continue with branch details.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setVerifySending(false)
    }
  }

  const saveBranchEdit = async (form) => {
    try {
      setSaving(true)
      const { branchUsername, branchPassword, autoGeneratePassword, ownerEmail, ownerOtp, ...patchBody } = form
      await api.patch(`/restaurant/branches/${modalBranch._id}`, patchBody, { skipBranchHeader: true })
      toast.success('Branch updated')
      closeModal()
      await reloadBranches()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  const submitCreateBranch = async () => {
    if (!ownerVerifyToken) {
      toast.error('Verify your Gmail on step 1 first.')
      return
    }
    if (!String(createForm.name || '').trim()) {
      toast.error('Branch name is missing. Go back to step 1.')
      return
    }
    try {
      setSaving(true)
      const ownerEmail = String(createForm.ownerEmail || '').trim().toLowerCase()
      const payload = {
        name: createForm.name,
        branchCode: createForm.branchCode,
        branchManagerName: createForm.branchManagerName,
        ownerEmail,
        ownerVerifyToken,
        phone: createForm.phone,
        address: createForm.address,
        city: createForm.city,
        state: createForm.state,
        country: createForm.country,
        taxNumber: createForm.taxNumber,
        status: createForm.status,
        branchUsername: createForm.branchUsername,
        branchPassword: createForm.branchPassword,
        autoGeneratePassword: createForm.autoGeneratePassword,
        enabledModules: MODULE_DEFS.reduce((acc, { key }) => {
          acc[key] = createForm.enabledModules?.[key] !== false
          return acc
        }, {}),
      }
      const res = await api.post('/restaurant/branches', payload, { skipBranchHeader: true })
      const cred = res.data?.data?.credentials
      if (cred) setCredentials(cred)
      if (res.data?.data?.credentialsEmailSent) {
        toast.success('Branch created. Login credentials were emailed to the owner.')
      } else {
        toast.success('Branch created')
      }
      closeModal()
      await reloadBranches()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  const deleteBranch = async (branch) => {
    if (!window.confirm(`Delete ${branch.name}?`)) return
    try {
      await api.delete(`/restaurant/branches/${branch._id}`, { skipBranchHeader: true })
      toast.success('Branch deleted')
      await reloadBranches()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete branch')
    }
  }

  const summary = analytics.summary || {}
  const reportModel = useMemo(() => {
    return makeReportModel(analytics)
  }, [analytics])

  const reportInsights = useMemo(() => {
    const revenue = Number(summary.revenue || 0)
    const expenses = Number(summary.expenses || 0)
    const netProfit = Number(summary.netProfit || 0)
    const orders = Number(summary.customerOrders || summary.totalOrders || 0)
    const paidOrders = Number(reportModel.payment.find((row) => row.name.toLowerCase() === 'paid')?.orders || 0)
    const unpaidValue = reportModel.payment
      .filter((row) => row.name.toLowerCase() !== 'paid')
      .reduce((sum, row) => sum + Number(row.revenue || 0), 0)
    const bestDay = [...reportModel.trends].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0]
    const busiestHour = [...reportModel.hourly].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0]
    const topItem = reportModel.topItems[0]
    return {
      profitMargin: ratioPercent(netProfit, revenue),
      expenseRatio: ratioPercent(expenses, revenue),
      paidOrderRate: ratioPercent(paidOrders, orders),
      unpaidValue,
      bestDay,
      busiestHour,
      topItem,
    }
  }, [reportModel, summary])

  const downloadBranchReport = async (branch = selectedBranch) => {
    if (!branch?._id) {
      toast.error('Select a branch first.')
      return
    }
    try {
      setDownloadingBranchId(String(branch._id))
      const useLoaded = String(branch._id) === String(selectedBranch?._id)
      const [analyticsRes, activityRes] = useLoaded && analytics?.summary
        ? [{ data: { data: analytics } }, { data: { data: { items: activity } } }]
        : await Promise.all([
            api.get(`/restaurant/branches/${branch._id}/analytics`, { skipBranchHeader: true }),
            api.get(`/restaurant/branches/${branch._id}/activity`, { skipBranchHeader: true }),
          ])

      const nextAnalytics = analyticsRes.data?.data || {}
      const nextReport = makeReportModel(nextAnalytics)
      const nextActivity = activityRes.data?.data?.items || []
      const lines = buildBranchReportLines({
        branch,
        analytics: nextAnalytics,
        report: nextReport,
        activity: nextActivity,
        enabledModules: getEnabledModulesForBranch(branch),
      })
      const stamp = new Date().toISOString().slice(0, 10)
      downloadPdfFromLines(lines, `${safeFileName(branch.name)}-full-report-${stamp}.pdf`)
      toast.success(`${branch.name || 'Branch'} PDF report downloaded`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download report')
    } finally {
      setDownloadingBranchId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Enterprise</p>
          <h1 className="mt-1 text-3xl font-black text-gray-950 dark:text-gray-100">Branch Management</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create, switch, monitor, and protect independent branch operations.</p>
        </div>
        {canManageBranches ? (
          <Button onClick={openCreateModal}>
            <FiPlus className="mr-2 h-4 w-4" /> Add branch
          </Button>
        ) : (
          <span className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            Main branch permission required
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric icon={FiMapPin} label="Branches" value={branches.length} />
        <Metric icon={FiBarChart2} label="Revenue" value={money(summary.revenue)} />
        <Metric icon={FiUsers} label="Employees" value={summary.employees || 0} />
        <Metric icon={FiRefreshCw} label="Inventory value" value={money(summary.inventoryValue)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-surface-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Branch list</h2>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-gray-800">
            {branches.map((branch) => (
              <div
                role="button"
                tabIndex={0}
                key={branch._id}
                onClick={() => setReportBranchId(String(branch._id))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setReportBranchId(String(branch._id))
                  }
                }}
                className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-surface-50 dark:hover:bg-gray-800 ${
                  String(reportBranchId) === String(branch._id) ? 'bg-primary-50/70 dark:bg-gray-800' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-gray-950 dark:text-gray-100">{branch.name}</p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{branch.city || branch.address || branch.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${branch.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {branch.status}
                  </span>
                  {canManageBranches && !branch.isDefault && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setModalBranch(branch); setModalOpen(true) }} className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-primary-700 dark:hover:bg-gray-900">
                      <FiEdit2 />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); downloadBranchReport(branch) }}
                    disabled={String(downloadingBranchId) === String(branch._id)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-primary-700 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-gray-900"
                    title="Download full branch report PDF"
                  >
                    <FiDownload className={String(downloadingBranchId) === String(branch._id) ? 'animate-pulse' : ''} />
                  </button>
                  {canManageBranches && !branch.isDefault && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteBranch(branch) }} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">{selectedBranch?.name || 'Branch'} analytics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue and order trend for selected branch.</p>
            </div>
            {loadingAnalytics && <span className="text-xs font-bold text-gray-400">Loading</span>}
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue" fill="#8f2800" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-surface-100 pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Report section</p>
            <h2 className="mt-1 text-xl font-black text-gray-950 dark:text-gray-100">{selectedBranch?.name || 'Branch'} detailed report</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Selecting a branch here only changes this report. It does not switch your whole system branch or header data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadBranchReport(selectedBranch)}
              disabled={!selectedBranch?._id || Boolean(downloadingBranchId)}
            >
              <FiDownload className={`mr-2 h-4 w-4 ${downloadingBranchId ? 'animate-pulse' : ''}`} />
              {downloadingBranchId ? 'Preparing PDF' : 'Download report'}
            </Button>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${selectedBranch?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {selectedBranch?.status || 'unknown'}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Branch details</p>
            <dl className="mt-3 space-y-2 text-sm">
              <ReportRow label="Public ID" value={selectedBranch?.publicBranchId || selectedBranch?._id} />
              <ReportRow label="Slug" value={selectedBranch?.slug} />
              <ReportRow label="Manager" value={selectedBranch?.branchManagerName} />
              <ReportRow label="Phone" value={selectedBranch?.phone} />
              <ReportRow label="Tax number" value={selectedBranch?.taxNumber} />
            </dl>
          </div>

          <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
            <dl className="mt-3 space-y-2 text-sm">
              <ReportRow label="Address" value={selectedBranch?.address} />
              <ReportRow label="City" value={selectedBranch?.city} />
              <ReportRow label="State" value={selectedBranch?.state} />
              <ReportRow label="Country" value={selectedBranch?.country} />
            </dl>
          </div>

          <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Performance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <ReportRow label="Revenue" value={money(summary.revenue)} />
              <ReportRow label="Expenses" value={money(summary.expenses)} />
              <ReportRow label="Net profit" value={money(summary.netProfit)} />
              <ReportRow label="Average order" value={money(summary.averageOrderValue)} />
              <ReportRow label="Employees" value={summary.employees || 0} />
              <ReportRow label="Inventory value" value={money(summary.inventoryValue)} />
              <ReportRow label="Orders" value={summary.customerOrders || summary.totalOrders || 0} />
              <ReportRow label="Low stock items" value={summary.lowStockItems || 0} />
            </dl>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={FiShoppingBag} label="Customer orders" value={summary.customerOrders || summary.totalOrders || 0} />
          <Metric icon={FiCreditCard} label="Avg order value" value={money(summary.averageOrderValue)} />
          <Metric icon={FiAlertTriangle} label="Low stock" value={summary.lowStockItems || 0} />
          <Metric icon={FiBox} label="Inventory items" value={summary.inventoryItems || 0} />
        </div>

        <div className="mt-5 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-emerald-50 p-5 dark:border-primary-900/40 dark:from-primary-950/20 dark:via-gray-900 dark:to-gray-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Executive snapshot</p>
              <h3 className="mt-1 text-lg font-black text-gray-950 dark:text-gray-100">Branch health and operating signals</h3>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${Number(summary.netProfit || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
              {Number(summary.netProfit || 0) >= 0 ? 'Profitable' : 'Loss making'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InsightTile label="Profit margin" value={percent(reportInsights.profitMargin)} detail={`${money(summary.netProfit)} net profit`} />
            <InsightTile label="Expense ratio" value={percent(reportInsights.expenseRatio)} detail={`${money(summary.expenses)} spent`} />
            <InsightTile label="Paid order rate" value={percent(reportInsights.paidOrderRate)} detail={`${money(reportInsights.unpaidValue)} unpaid value`} />
            <InsightTile label="Best day" value={reportInsights.bestDay?.date || '-'} detail={reportInsights.bestDay ? `${money(reportInsights.bestDay.revenue)} · ${reportInsights.bestDay.orders} orders` : 'No sales yet'} />
            <InsightTile label="Busiest hour" value={reportInsights.busiestHour?.hour || '-'} detail={reportInsights.busiestHour ? `${reportInsights.busiestHour.orders} orders · ${money(reportInsights.busiestHour.revenue)}` : 'No hourly demand'} />
            <InsightTile label="Top item" value={reportInsights.topItem?.name || '-'} detail={reportInsights.topItem ? `${reportInsights.topItem.quantity} sold · ${money(reportInsights.topItem.revenue)}` : 'No item data'} />
            <InsightTile label="Expense entries" value={summary.expenseEntries || 0} detail="Recorded operating costs" />
            <InsightTile label="Stock pressure" value={summary.lowStockItems || 0} detail="Items at or under minimum" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartPanel title="Financial bridge" subtitle="Revenue, expenses, and net profit" empty={reportModel.financeBridge.every((row) => Number(row.amount || 0) === 0)}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.financeBridge} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="amount" name="Amount" radius={[10, 10, 4, 4]}>
                  {reportModel.financeBridge.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? '#14b8a6' : index === 1 ? '#dc2626' : '#8f2800'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Revenue and order trend" subtitle="Last 30 sales days" empty={reportModel.trends.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={reportModel.trends} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(value, name) => (name === 'Revenue' ? money(value) : value)} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" fill="#f6d8c9" stroke="#8f2800" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#14b8a6" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Hourly demand" subtitle="Orders by hour" empty={reportModel.hourly.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportModel.hourly} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(value, name) => (name === 'revenue' ? money(value) : value)} />
                <Area type="monotone" dataKey="orders" name="Orders" fill="#ccfbf1" stroke="#14b8a6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Order status mix" subtitle="Operational state" empty={reportModel.status.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportModel.status} dataKey="orders" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={3}>
                  {reportModel.status.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value} orders`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Status value comparison" subtitle="Order count and bill value by status" empty={reportModel.status.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={reportModel.status} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(value, name) => (name === 'Revenue' ? money(value) : value)} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#8f2800" radius={[10, 10, 4, 4]} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#14b8a6" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Payment status" subtitle="Paid vs unpaid bill value" empty={reportModel.payment.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.payment} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(value, name) => (name === 'Revenue' ? money(value) : value)} />
                <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Payment order mix" subtitle="How many bills are paid, pending, or partial" empty={reportModel.payment.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportModel.payment} dataKey="orders" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={3}>
                  {reportModel.payment.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value} orders`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Order channels" subtitle="Source of customer activity" empty={reportModel.channel.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.channel} layout="vertical" margin={{ top: 12, right: 16, left: 42, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={90} />
                <Tooltip formatter={(value, name) => (name === 'Revenue' ? money(value) : value)} />
                <Bar dataKey="orders" name="Orders" fill="#f97316" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top selling items" subtitle="Quantity and revenue" empty={reportModel.topItems.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.topItems} layout="vertical" margin={{ top: 12, right: 18, left: 56, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={112} />
                <Tooltip formatter={(value, name) => (name === 'Revenue' ? money(value) : value)} />
                <Bar dataKey="revenue" name="Revenue" fill="#0f766e" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Item volume" subtitle="Quantity sold by dish" empty={reportModel.topItems.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.topItems} layout="vertical" margin={{ top: 12, right: 18, left: 56, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={112} />
                <Tooltip />
                <Bar dataKey="quantity" name="Quantity" fill="#14b8a6" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Expense categories" subtitle="Where money is spent" empty={reportModel.expenseCategories.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportModel.expenseCategories} dataKey="amount" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={3}>
                  {reportModel.expenseCategories.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Inventory value" subtitle="Stock value by category" empty={reportModel.inventoryCategories.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.inventoryCategories} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="value" name="Value" fill="#ca8a04" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Low stock pressure" subtitle="Gap against minimum stock" empty={reportModel.lowStockItems.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportModel.lowStockItems} layout="vertical" margin={{ top: 12, right: 18, left: 56, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={112} />
                <Tooltip />
                <Bar dataKey="stockGap" name="Gap" fill="#dc2626" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ReportTable title="Recent orders" icon={FiClock}>
            {reportModel.recentOrders.length === 0 ? (
              <EmptyReportText>No recent orders for this branch.</EmptyReportText>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                    {reportModel.recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-3 py-3 font-bold text-gray-950 dark:text-gray-100">#{order.orderNumber}</td>
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{order.customerName || 'Guest'}</td>
                        <td className="px-3 py-3"><StatusBadge value={order.status} /></td>
                        <td className="px-3 py-3 text-right font-bold text-primary-700">{money(order.grandTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportTable>

          <ReportTable title="Low stock watch" icon={FiAlertTriangle}>
            {reportModel.lowStockItems.length === 0 ? (
              <EmptyReportText>No low-stock items found.</EmptyReportText>
            ) : (
              <div className="space-y-3">
                {reportModel.lowStockItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-50 px-4 py-3 dark:bg-gray-800/60">
                    <div className="min-w-0">
                      <p className="truncate font-black text-gray-950 dark:text-gray-100">{item.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{prettyLabel(item.category)} · Min {item.minimumStock || 0} {item.unit}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-amber-700">{Number(item.quantity || 0)} {item.unit}</p>
                      <p className="text-xs text-gray-400">{money(Number(item.quantity || 0) * Number(item.costPerUnit || 0))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ReportTable>
        </div>

        <div className="mt-4 rounded-2xl border border-surface-100 p-4 dark:border-gray-800">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Enabled modules</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {enabledModuleList.map((label) => (
              <span key={label} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950/30 dark:text-primary-200">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Branch activity</h2>
          {loadingActivity && <span className="text-xs font-bold text-gray-400">Loading</span>}
        </div>
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto text-sm">
          {activity.length === 0 && <li className="text-gray-500">No recent audit events.</li>}
          {activity.map((row) => (
            <li key={`${row._id || row.timestamp}`} className="rounded-xl border border-surface-100 px-3 py-2 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-gray-100">{row.action}</span>
              <span className="text-gray-500 dark:text-gray-400"> · {row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}</span>
              {row.ipAddress && <span className="block text-xs text-gray-400">{row.ipAddress}</span>}
            </li>
          ))}
        </ul>
      </section>

      <Modal isOpen={modalOpen} onClose={closeModal} title={modalBranch?._id ? 'Edit branch' : createStep === 1 ? 'Create branch (1 / 2)' : 'Create branch (2 / 2)'} size="lg">
        <div className="p-6">
          {modalBranch?._id ? (
            <BranchEditForm
              initial={modalBranch}
              saving={saving}
              onClose={closeModal}
              onSubmit={saveBranchEdit}
            />
          ) : (
            <CreateBranchWizard
              form={createForm}
              setForm={setCreateForm}
              step={createStep}
              onStepBack={() => {
                setCreateStep(1)
                setOwnerVerifyToken('')
                setResendCooldown(0)
                setCreateForm((c) => ({ ...c, ownerOtp: '' }))
              }}
              saving={saving}
              otpSending={otpSending}
              verifySending={verifySending}
              resendCooldown={resendCooldown}
              devOtpHint={devOtpBanner}
              otpExpiresMinutes={otpExpiryMinutesHint}
              onRequestOwnerOtp={requestOwnerOtp}
              onVerifyOtp={verifyOwnerOtp}
              onSubmitCreate={submitCreateBranch}
              onClose={closeModal}
            />
          )}
        </div>
      </Modal>

      <Modal isOpen={Boolean(credentials)} onClose={() => setCredentials(null)} title="Branch login credentials" size="md">
        <div className="space-y-3 p-6 text-sm">
          <p className="text-gray-600 dark:text-gray-300">Share these credentials with the branch manager. The password is shown only once.</p>
          {credentials && (
            <div className="rounded-xl bg-surface-50 p-4 font-mono text-xs dark:bg-gray-800">
              <p><span className="font-sans font-bold">Branch owner Gmail:</span> {credentials.ownerEmail || '—'}</p>
              <p><span className="font-sans font-bold">Restaurant ID (sign-in):</span> {credentials.publicRestaurantId || credentials.restaurantId}</p>
              <p><span className="font-sans font-bold">Branch login email:</span> {credentials.branchEmail || '—'}</p>
              <p><span className="font-sans font-bold">Branch security key:</span> {credentials.branchPortalKey}</p>
              <p><span className="font-sans font-bold">Public branch ID:</span> {credentials.publicBranchId}</p>
              <p><span className="font-sans font-bold">Branch slug:</span> {credentials.branchSlug}</p>
              <p><span className="font-sans font-bold">Local username:</span> {credentials.username}</p>
              <p><span className="font-sans font-bold">Password:</span> {credentials.password}</p>
              <p className="mt-2 break-all font-sans text-gray-500">
                Sign-in URL:{' '}
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {typeof window !== 'undefined' && credentials.loginPath
                    ? `${window.location.origin}${credentials.loginPath}`
                    : credentials.loginPath || ''}
                </span>
              </p>
              <p className="font-sans text-xs text-gray-400">Share this link only with branch staff. It includes your outlet id and a secret key.</p>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={() => setCredentials(null)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-gray-950 dark:text-gray-100">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function InsightTile({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
      <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-gray-950 dark:text-gray-100" title={String(value || '')}>{value}</p>
      <p className="mt-1 max-h-9 overflow-hidden text-xs font-semibold text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  )
}

function ChartPanel({ title, subtitle, empty, children }) {
  return (
    <div className="rounded-2xl border border-surface-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-950 dark:text-gray-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs font-semibold text-gray-400">{subtitle}</p> : null}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-200">
          <FiPieChart className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 h-72">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-surface-50 text-center dark:bg-gray-800/50">
            <FiBarChart2 className="h-7 w-7 text-primary-600" />
            <p className="mt-2 text-sm font-black text-gray-900 dark:text-gray-100">No chart data yet</p>
            <p className="mt-1 max-w-xs text-xs text-gray-500">This chart fills when this branch has matching records.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function ReportTable({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-surface-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-200">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-black text-gray-950 dark:text-gray-100">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EmptyReportText({ children }) {
  return (
    <div className="rounded-2xl bg-surface-50 px-4 py-6 text-center text-sm font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
      {children}
    </div>
  )
}

function StatusBadge({ value }) {
  const status = String(value || 'unknown')
  const className =
    status === 'served' || status === 'completed'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'cancelled'
        ? 'bg-red-50 text-red-700'
        : status === 'pending'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-blue-50 text-blue-700'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${className}`}>{prettyLabel(status)}</span>
}

function ReportRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="min-w-0 break-words text-right font-bold text-gray-900 dark:text-gray-100">
        {value || '-'}
      </dd>
    </div>
  )
}

export default Branches
