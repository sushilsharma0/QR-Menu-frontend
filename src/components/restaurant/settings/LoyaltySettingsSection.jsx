import React, { useEffect, useState } from 'react'
import { FiAward, FiMessageCircle } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../../services/api'
import Button from '../../common/Button'
import Input from '../../common/Input'

export default function LoyaltySettingsSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    enabled: true,
    pointsPerCurrencyUnit: 50,
    minPointsPerOrder: 0,
    minOrderAmount: 0,
    smsOnOrderReady: false,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/restaurant/auth/profile')
        const loyalty = res.data?.data?.settings?.loyalty || {}
        setForm({
          enabled: loyalty.enabled !== false,
          pointsPerCurrencyUnit: loyalty.pointsPerCurrencyUnit ?? 50,
          minPointsPerOrder: loyalty.minPointsPerOrder ?? 0,
          minOrderAmount: loyalty.minOrderAmount ?? 0,
          smsOnOrderReady: loyalty.smsOnOrderReady === true,
        })
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/restaurant/auth/profile', { loyalty: form })
      toast.success('Loyalty settings saved')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <FiAward className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Loyalty & SMS</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Configure how guests earn points and optional SMS when orders are ready.
      </p>
      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          />
          Enable loyalty points on QR checkout
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Points per currency unit (e.g. 50 = 1 pt per Rs. 50)"
            type="number"
            min={1}
            value={form.pointsPerCurrencyUnit}
            onChange={(e) => setForm((f) => ({ ...f, pointsPerCurrencyUnit: e.target.value }))}
          />
          <Input
            label="Minimum order amount for points"
            type="number"
            min={0}
            value={form.minOrderAmount}
            onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
          />
          <Input
            label="Minimum points per qualifying order"
            type="number"
            min={0}
            value={form.minPointsPerOrder}
            onChange={(e) => setForm((f) => ({ ...f, minPointsPerOrder: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <FiMessageCircle className="text-primary-600" />
          <input
            type="checkbox"
            checked={form.smsOnOrderReady}
            onChange={(e) => setForm((f) => ({ ...f, smsOnOrderReady: e.target.checked }))}
          />
          Send SMS when order status is set to Ready (requires Twilio in server .env)
        </label>
        <Button onClick={save} loading={saving}>Save loyalty settings</Button>
      </div>
    </section>
  )
}
