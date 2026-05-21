import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { FiEdit2, FiGrid, FiList, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiTag } from 'react-icons/fi'
import toast from '@utils/toast'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import api from '../../services/api'
import { createPromotion, deletePromotion, getPromotions, updatePromotion } from '../../services/restaurant'
import { RestaurantPageLoader, formatRestaurantCurrency } from '../../components/restaurant/RestaurantUI'

const initialForm = {
  name: '',
  code: '',
  discountType: 'percent',
  discountValue: '',
  scope: 'order',
  targetMenuItems: [],
  minOrderAmount: '',
  maxDiscountAmount: '',
  startAt: '',
  endAt: '',
  usageLimit: '',
  bannerText: '',
  bannerColor: '#f97316',
  isActive: true,
}

const PAGE_SIZE_OPTIONS = [6, 12, 24]

const PromoStatusPill = ({ active }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
    }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
)

const Promotions = () => {
  const [promotions, setPromotions] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [promoRes, itemsRes] = await Promise.all([getPromotions(), api.get('/restaurant/menu/items')])
      setPromotions(promoRes.data || [])
      setMenuItems(itemsRes?.data?.data || [])
    } catch (err) {
      toast.error('Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const closeFormModal = () => {
    setIsFormModalOpen(false)
    resetForm()
  }

  const openCreateModal = () => {
    resetForm()
    setIsFormModalOpen(true)
  }

  const payload = useMemo(
    () => ({
      ...form,
      code: form.code.trim().toUpperCase(),
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      targetMenuItems: form.scope === 'item' ? form.targetMenuItems : [],
    }),
    [form]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.code || !form.discountValue || !form.startAt || !form.endAt) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      if (editingId) {
        await updatePromotion(editingId, payload)
        toast.success('Promotion updated')
      } else {
        await createPromotion(payload)
        toast.success('Promotion created')
      }
      closeFormModal()
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save promotion')
    }
  }

  const handleEdit = (promo) => {
    setEditingId(promo._id)
    setForm({
      name: promo.name || '',
      code: promo.code || '',
      discountType: promo.discountType || 'percent',
      discountValue: promo.discountValue || '',
      scope: promo.scope || 'order',
      targetMenuItems: (promo.targetMenuItems || []).map((item) => (typeof item === 'string' ? item : item._id)),
      minOrderAmount: promo.minOrderAmount || '',
      maxDiscountAmount: promo.maxDiscountAmount || '',
      startAt: promo.startAt ? new Date(promo.startAt).toISOString().slice(0, 16) : '',
      endAt: promo.endAt ? new Date(promo.endAt).toISOString().slice(0, 16) : '',
      usageLimit: promo.usageLimit || '',
      bannerText: promo.bannerText || '',
      bannerColor: promo.bannerColor || '#f97316',
      isActive: promo.isActive ?? true,
    })
    setIsFormModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id)
      toast.success('Promotion deleted')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete promotion')
    }
  }

  const filteredPromotions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return promotions.filter((promo) => {
      const matchesSearch =
        !query ||
        String(promo.name || '').toLowerCase().includes(query) ||
        String(promo.code || '').toLowerCase().includes(query) ||
        String(promo.bannerText || '').toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? Boolean(promo.isActive) : !Boolean(promo.isActive))
      const matchesScope = scopeFilter === 'all' || String(promo.scope || '') === scopeFilter
      return matchesSearch && matchesStatus && matchesScope
    })
  }, [promotions, search, statusFilter, scopeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedPromotions = filteredPromotions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeCount = promotions.filter((promo) => promo.isActive).length

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, scopeFilter, pageSize, viewMode])

  if (loading) return <RestaurantPageLoader />

  return (
    <LazyMotion features={domAnimation}>
    <div className="space-y-6">
      <m.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-primary-50 via-surface-50 to-amber-50" />
        <div className="relative p-5 md:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
            <FiTag className="h-4 w-4" />
            Promotion Studio
          </div>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Promotions</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage offer campaigns with cleaner filters, better visibility, and faster updates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={fetchData}>
                <FiRefreshCw className="mr-2" />
                Refresh
              </Button>
              <Button type="button" onClick={openCreateModal}>
                <FiPlus className="mr-2" />
                Create Promotion
              </Button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Total promotions', value: promotions.length },
              { label: 'Active promotions', value: activeCount },
              { label: 'Filtered result', value: filteredPromotions.length },
            ].map((stat) => (
              <m.div
                key={stat.label}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-surface-200 bg-white/90 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-950">{stat.value}</p>
              </m.div>
            ))}
          </div>
        </div>
      </m.section>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editingId ? 'Update Promotion' : 'Create Promotion'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Promotion Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Promo Code</label>
              <input
                type="text"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 uppercase outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Discount Type</label>
              <select
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.discountType}
                onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Discount Value</label>
              <input
                type="number"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.discountValue}
                onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Apply To</label>
              <select
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.scope}
                onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value, targetMenuItems: [] }))}
              >
                <option value="order">Entire Order</option>
                <option value="item">Specific Items</option>
              </select>
            </div>
          </div>

          {form.scope === 'item' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Target Menu Items</label>
              <select
                multiple
                value={form.targetMenuItems}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((option) => option.value)
                  setForm((p) => ({ ...p, targetMenuItems: values }))
                }}
                className="h-32 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                {menuItems.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple items.</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Minimum Order Amount</label>
              <input
                type="number"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.minOrderAmount}
                onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Discount (optional)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Usage Limit (optional)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.startAt}
                onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.endAt}
                onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Banner Text</label>
              <input
                className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={form.bannerText}
                onChange={(e) => setForm((p) => ({ ...p, bannerText: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Banner Color</label>
              <input
                type="color"
                value={form.bannerColor}
                onChange={(e) => setForm((p) => ({ ...p, bannerColor: e.target.value }))}
                className="h-11 w-16 rounded-lg border border-surface-300"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active Promotion
          </label>

          <div className="flex flex-wrap gap-2 border-t border-surface-200 pt-4">
            <Button type="submit">
              <FiPlus className="mr-2" />
              {editingId ? 'Update Promotion' : 'Create Promotion'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Card
        title={`Promotions (${filteredPromotions.length})`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={openCreateModal}>
              <FiPlus className="mr-1 h-4 w-4" />
              Create
            </Button>
            <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                  viewMode === 'card' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                <FiGrid className="h-4 w-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                  viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                <FiList className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Search name, code, banner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All scope</option>
            <option value="order">Order level</option>
            <option value="item">Item level</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <AnimatePresence mode="wait">
          {paginatedPromotions.length === 0 ? (
            <m.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                <FiSearch className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-950">No promotions found</h3>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or create a new prom.</p>
            </m.div>
          ) : viewMode === 'card' ? (
            <m.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {paginatedPromotions.map((promo, index) => (
                <m.article
                  key={promo._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="h-2 w-full" style={{ backgroundColor: promo.bannerColor || '#f97316' }} />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-950">{promo.name}</p>
                        <p className="mt-1 font-mono text-sm text-primary-600">{promo.code}</p>
                      </div>
                      <PromoStatusPill active={promo.isActive} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {promo.discountType === 'percent'
                        ? `${promo.discountValue}% off`
                        : `${formatRestaurantCurrency(promo.discountValue)} off`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Scope: <span className="font-semibold capitalize text-gray-700">{promo.scope}</span>
                    </p>
                    <p className="line-clamp-2 text-sm text-gray-500">
                      {promo.bannerText || 'No banner message added yet.'}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(promo)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <FiEdit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(promo._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </m.article>
              ))}
            </m.div>
          ) : (
            <m.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto rounded-2xl border border-surface-200"
            >
              <table className="min-w-full divide-y divide-surface-200">
                <thead className="bg-surface-50">
                  <tr>
                    {['Name', 'Code', 'Discount', 'Scope', 'Status', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 bg-white">
                  {paginatedPromotions.map((promo) => (
                    <tr key={promo._id} className="transition hover:bg-surface-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{promo.name}</td>
                      <td className="px-4 py-3 font-mono text-primary-600">{promo.code}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {promo.discountType === 'percent'
                          ? `${promo.discountValue}%`
                          : formatRestaurantCurrency(promo.discountValue)}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{promo.scope}</td>
                      <td className="px-4 py-3">
                        <PromoStatusPill active={promo.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(promo)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(promo._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </m.div>
          )}
        </AnimatePresence>

        {filteredPromotions.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-surface-200 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span>-
              <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, filteredPromotions.length)}</span> of{' '}
              <span className="font-semibold text-gray-900">{filteredPromotions.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span className="text-sm font-semibold text-gray-700">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
    </LazyMotion>
  )
}

export default Promotions
