import React, { useEffect, useMemo, useState } from 'react'
import { FiBook, FiPlus } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { FinancePageHeader, FinancePageShell, FinancePanel } from './FinanceUI'
import { RestaurantPageLoader } from '../../../components/restaurant/RestaurantUI'

const emptyLine = { accountCode: '', debit: '', credit: '' }

export default function FinanceAccounting() {
  const [accounts, setAccounts] = useState([])
  const [trialBalance, setTrialBalance] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState([{ ...emptyLine }, { ...emptyLine }])
  const [posting, setPosting] = useState(false)

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ code: String(a.code), label: `${a.code} — ${a.name}` })),
    [accounts],
  )

  const load = async () => {
    setLoading(true)
    try {
      const [accRes, tbRes] = await Promise.all([
        api.get('/restaurant/finance/accounting/accounts'),
        api.get('/restaurant/finance/accounting/trial-balance', { params: { from, to } }),
      ])
      setAccounts(accRes.data?.data || [])
      setTrialBalance(tbRes.data?.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load accounting')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [from, to])

  const postEntry = async () => {
    const payloadLines = lines
      .map((l) => ({
        accountCode: String(l.accountCode || '').trim(),
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }))
      .filter((l) => l.accountCode && (l.debit > 0 || l.credit > 0))

    if (payloadLines.length < 2) {
      toast.error('Add at least two lines with an account and a debit or credit amount')
      return
    }

    const deb = payloadLines.reduce((s, l) => s + l.debit, 0)
    const cred = payloadLines.reduce((s, l) => s + l.credit, 0)
    if (Number(deb.toFixed(2)) !== Number(cred.toFixed(2))) {
      toast.error('Total debits must equal total credits')
      return
    }

    setPosting(true)
    try {
      await api.post('/restaurant/finance/accounting/journal-entries', {
        entryDate,
        memo,
        lines: payloadLines,
      })
      toast.success('Journal entry posted')
      setMemo('')
      setLines([{ ...emptyLine }, { ...emptyLine }])
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not post entry')
    } finally {
      setPosting(false)
    }
  }

  const updateLine = (idx, field, value) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)))
  }

  if (loading && !accounts.length) return <RestaurantPageLoader label="Loading accounting…" />

  return (
    <FinancePageShell>
      <FinancePageHeader
        title="Accounting"
        subtitle="Chart of accounts, manual journal entries, and trial balance."
        actions={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <FinancePanel title="Chart of accounts" bodyClassName="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a._id || a.code} className="border-b border-surface-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-mono text-xs">{a.code}</td>
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2 text-gray-500">{a.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FinancePanel>

        <FinancePanel title="Trial balance" bodyClassName="max-h-96 overflow-auto">
          <div className="flex flex-wrap gap-2 border-b border-surface-100 px-4 py-3 dark:border-gray-800">
            <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-2">Account</th>
                <th className="px-4 py-2 text-right">Debit</th>
                <th className="px-4 py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((row) => (
                <tr key={row._id} className="border-b border-surface-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-mono text-xs">{row._id}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{Number(row.debit || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{Number(row.credit || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FinancePanel>
      </div>

      <FinancePanel title="Post journal entry" className="mt-6">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" label="Entry date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            <Input label="Memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Description" />
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-3">
              <label className="block text-sm">
                {idx === 0 && (
                  <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Account</span>
                )}
                <select
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={line.accountCode}
                  onChange={(e) => updateLine(idx, 'accountCode', e.target.value)}
                >
                  <option value="">Select account…</option>
                  {accountOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label={idx === 0 ? 'Debit' : ''}
                type="number"
                min="0"
                step="0.01"
                value={line.debit}
                onChange={(e) => updateLine(idx, 'debit', e.target.value)}
              />
              <Input
                label={idx === 0 ? 'Credit' : ''}
                type="number"
                min="0"
                step="0.01"
                value={line.credit}
                onChange={(e) => updateLine(idx, 'credit', e.target.value)}
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setLines((p) => [...p, { ...emptyLine }])}>
              <FiPlus className="mr-1 inline" /> Add line
            </Button>
            <Button onClick={postEntry} loading={posting}>
              <FiBook className="mr-1 inline" /> Post entry
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Pick accounts from the chart, enter debits and credits on separate lines, and ensure totals match.
          </p>
        </div>
      </FinancePanel>
    </FinancePageShell>
  )
}
