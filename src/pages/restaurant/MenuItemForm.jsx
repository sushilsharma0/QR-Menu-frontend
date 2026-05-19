import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Textarea from '../../components/common/Textarea'

const IMAGE_MAX_BYTES = 1 * 1024 * 1024

const DIETARY_TAG_OPTIONS = [
  { value: 'veg', label: 'Veg', color: 'green' },
  { value: 'egg', label: 'Egg', color: 'amber' },
  { value: 'chicken', label: 'Chicken', color: 'orange' },
  { value: 'mutton', label: 'Mutton', color: 'red' },
  { value: 'buff', label: 'Buff', color: 'rose' },
  { value: 'pork', label: 'Pork', color: 'pink' },
  { value: 'fish', label: 'Fish', color: 'blue' },
  { value: 'seafood', label: 'Seafood', color: 'cyan' },
]

const TAG_COLOR_CLASS = {
  green: 'bg-green-50 text-green-700 border-green-300 ring-green-300',
  amber: 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-300',
  orange: 'bg-orange-50 text-orange-700 border-orange-300 ring-orange-300',
  red: 'bg-red-50 text-red-700 border-red-300 ring-red-300',
  rose: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-300',
  pink: 'bg-pink-50 text-pink-700 border-pink-300 ring-pink-300',
  blue: 'bg-blue-50 text-blue-700 border-blue-300 ring-blue-300',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-300 ring-cyan-300',
}

const MenuItemForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dietaryTags, setDietaryTags] = useState([])
  const [variationGroups, setVariationGroups] = useState([])
  const [nutrition, setNutrition] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  })
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  const handleNutritionChange = (field) => (e) => {
    const v = e.target.value
    setNutrition((prev) => ({ ...prev, [field]: v }))
  }

  const toggleDietaryTag = (value) => {
    setDietaryTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  useEffect(() => {
    fetchCategories()
    if (id) fetchMenuItem()
  }, [id])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/restaurant/menu/categories')
      setCategories(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch categories')
    }
  }

  const fetchMenuItem = async () => {
    try {
      const res = await api.get(`/restaurant/menu/items/${id}`)
      const item = res.data.data
      setValue('name', item.name)
      const categoryId =
        item.category && typeof item.category === 'object'
          ? item.category._id
          : item.category
      setValue('category', categoryId != null ? String(categoryId) : '')
      setValue('description', item.description)
      setValue('price', item.price)
      setValue('originalPrice', item.originalPrice)
      setValue('preparationTime', item.preparationTime)
      setValue('taxRate', item.taxRate)
      setValue('isAvailable', item.isAvailable)
      setDietaryTags(Array.isArray(item.dietaryTags) ? item.dietaryTags : [])
      setVariationGroups(Array.isArray(item.variationGroups) ? item.variationGroups : [])
      const n = item.nutrition || {}
      setNutrition({
        calories: n.calories ?? '',
        protein: n.protein ?? '',
        carbs: n.carbs ?? '',
        fat: n.fat ?? '',
        fiber: n.fiber ?? '',
      })
      if (item.image) setImagePreview(item.image)
    } catch (error) {
      toast.error('Failed to fetch menu item')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      const formData = new FormData()

      // Append normal fields
      if (data.name) formData.append('name', data.name)
      if (data.category) formData.append('category', data.category)
      if (data.description) formData.append('description', data.description)
      if (data.price) formData.append('price', data.price)
      if (data.originalPrice) formData.append('originalPrice', data.originalPrice)
      if (data.preparationTime) formData.append('preparationTime', data.preparationTime)
      if (data.taxRate) formData.append('taxRate', data.taxRate)
      formData.append('isVegetarian', 'false')
      formData.append('isSpicy', 'false')
      if (data.isAvailable) formData.append('isAvailable', data.isAvailable)
      // Always send tags (so an empty array clears them server-side)
      formData.append('dietaryTags', JSON.stringify(dietaryTags))

      // Nutrition: keep only numeric fields, send as JSON so the server can
      // tell "field cleared" from "field unchanged".
      const cleanNutrition = Object.fromEntries(
        Object.entries(nutrition)
          .map(([k, v]) => [k, v === '' || v == null ? null : Number(v)])
          .filter(([, v]) => v !== null && Number.isFinite(v) && v >= 0)
      )
      formData.append('nutrition', JSON.stringify(cleanNutrition))
      formData.append('variationGroups', JSON.stringify(variationGroups))

      // Append image file if selected
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const url = id
        ? `/restaurant/menu/items/${id}`
        : `/restaurant/menu/items`

      const method = id ? 'put' : 'post'

      await api[method](url, formData)

      toast.success(id ? 'Menu item updated' : 'Menu item created')

      navigate(`${restaurantBase}/menu`)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > IMAGE_MAX_BYTES) {
        toast.error('Item image must be less than 1 MB')
        e.target.value = ''
        return
      }
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const addVariationGroup = () => {
    setVariationGroups((prev) => [
      ...prev,
      {
        name: 'Size',
        type: 'size',
        selectionType: 'single',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        displayType: 'chips',
        sortOrder: prev.length,
        isActive: true,
        options: [
          { name: 'Regular', additionalPrice: 0, isAvailable: true, isDefault: true },
          { name: 'Large', additionalPrice: 100, isAvailable: true },
        ],
      },
    ])
  }

  const updateVariationGroup = (index, patch) => {
    setVariationGroups((prev) => prev.map((group, i) => (i === index ? { ...group, ...patch } : group)))
  }

  const removeVariationGroup = (index) => {
    setVariationGroups((prev) => prev.filter((_, i) => i !== index))
  }

  const moveVariationGroup = (index, direction) => {
    setVariationGroups((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const [row] = next.splice(index, 1)
      next.splice(target, 0, row)
      return next.map((group, i) => ({ ...group, sortOrder: i }))
    })
  }

  const addVariationOption = (groupIndex) => {
    setVariationGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              options: [
                ...(group.options || []),
                { name: 'New option', additionalPrice: 0, isAvailable: true },
              ],
            }
          : group,
      ),
    )
  }

  const updateVariationOption = (groupIndex, optionIndex, patch) => {
    setVariationGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              options: (group.options || []).map((option, j) => {
                if (j !== optionIndex) return option
                const next = { ...option, ...patch }
                if (patch.isDefault && group.selectionType === 'single') {
                  return next
                }
                return next
              }).map((option, j) =>
                patch.isDefault && group.selectionType === 'single' && j !== optionIndex
                  ? { ...option, isDefault: false }
                  : option,
              ),
            }
          : group,
      ),
    )
  }

  const removeVariationOption = (groupIndex, optionIndex) => {
    setVariationGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? { ...group, options: (group.options || []).filter((_, j) => j !== optionIndex) }
          : group,
      ),
    )
  }



  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit' : 'Add'} Menu Item</h1>
        <p className="text-gray-500 mt-1">Create or update menu item details</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Item Name"
            placeholder="Enter item name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>

          <Textarea
            label="Description"
            rows={4}
            placeholder="Write something..."
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('price', { required: 'Price is required', min: 0 })}
              error={errors.price?.message}
            />
            <Input
              label="Original Price (Optional)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('originalPrice')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preparation Time (minutes)"
              type="number"
              placeholder="15"
              {...register('preparationTime')}
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              placeholder="0"
              {...register('taxRate')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
            <p className="mb-2 text-xs text-gray-500">Recommended square food photo: 800x800 px. Max 1 MB.</p>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type tags
              <span className="ml-2 text-xs text-gray-400">
                (Customers filter the menu using these — pick all that apply)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAG_OPTIONS.map((opt) => {
                const active = dietaryTags.includes(opt.value)
                const palette = TAG_COLOR_CLASS[opt.color] || TAG_COLOR_CLASS.green
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDietaryTag(opt.value)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
                      active
                        ? `${palette} ring-2`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nutrition (per serving)
              <span className="ml-2 text-xs text-gray-400">
                Optional — leave blank to hide the panel on the customer detail page.
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input
                label="Calories (kcal)"
                type="number"
                min="0"
                placeholder="420"
                value={nutrition.calories}
                onChange={handleNutritionChange('calories')}
              />
              <Input
                label="Protein (g)"
                type="number"
                min="0"
                placeholder="18"
                value={nutrition.protein}
                onChange={handleNutritionChange('protein')}
              />
              <Input
                label="Carbs (g)"
                type="number"
                min="0"
                placeholder="52"
                value={nutrition.carbs}
                onChange={handleNutritionChange('carbs')}
              />
              <Input
                label="Fat (g)"
                type="number"
                min="0"
                placeholder="16"
                value={nutrition.fat}
                onChange={handleNutritionChange('fat')}
              />
              <Input
                label="Fiber (g)"
                type="number"
                min="0"
                placeholder="3"
                value={nutrition.fiber}
                onChange={handleNutritionChange('fiber')}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Variations and add-ons</h2>
                <p className="text-xs text-gray-500">
                  Build dynamic sizes, portions, volumes, toppings, spice levels, and quantity add-ons.
                </p>
              </div>
              <Button type="button" size="sm" onClick={addVariationGroup}>
                Add group
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {variationGroups.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                  No variations. Customers will order this item at the base price.
                </div>
              ) : (
                variationGroups.map((group, groupIndex) => (
                  <div key={group._id || groupIndex} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <Input
                        label="Group name"
                        value={group.name || ''}
                        onChange={(e) => updateVariationGroup(groupIndex, { name: e.target.value })}
                      />
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={group.type || 'custom'}
                          onChange={(e) => updateVariationGroup(groupIndex, { type: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        >
                          {['size', 'portion', 'volume', 'weight', 'pieces', 'combo', 'temperature', 'flavor', 'spice', 'crust', 'preparation', 'addon', 'topping', 'custom'].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Selection</label>
                        <select
                          value={group.selectionType || 'single'}
                          onChange={(e) => {
                            const selectionType = e.target.value
                            updateVariationGroup(groupIndex, {
                              selectionType,
                              maxSelection: selectionType === 'single' ? 1 : group.maxSelection || 99,
                              displayType: selectionType === 'multiple' ? 'checkbox' : group.displayType || 'chips',
                            })
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="single">Single</option>
                          <option value="multiple">Multiple</option>
                          <option value="quantity">Quantity add-on</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Display</label>
                        <select
                          value={group.displayType || 'chips'}
                          onChange={(e) => updateVariationGroup(groupIndex, { displayType: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        >
                          {['radio', 'dropdown', 'chips', 'cards', 'image', 'checkbox', 'toggle', 'stepper'].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={group.isRequired === true}
                          onChange={(e) => updateVariationGroup(groupIndex, { isRequired: e.target.checked, minSelection: e.target.checked ? Math.max(1, Number(group.minSelection || 1)) : 0 })}
                        />
                        Required
                      </label>
                      <Input
                        label="Min"
                        type="number"
                        min="0"
                        value={group.minSelection ?? 0}
                        onChange={(e) => updateVariationGroup(groupIndex, { minSelection: Number(e.target.value) })}
                      />
                      <Input
                        label="Max"
                        type="number"
                        min="1"
                        disabled={(group.selectionType || 'single') === 'single'}
                        value={group.maxSelection ?? 1}
                        onChange={(e) => updateVariationGroup(groupIndex, { maxSelection: (group.selectionType || 'single') === 'single' ? 1 : Number(e.target.value) })}
                      />
                      <Button type="button" variant="secondary" onClick={() => moveVariationGroup(groupIndex, -1)}>
                        Up
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => moveVariationGroup(groupIndex, 1)}>
                        Down
                      </Button>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase text-gray-500">
                            <th className="py-2 pr-2">Option</th>
                            <th className="py-2 pr-2">+ Price</th>
                            <th className="py-2 pr-2">Discount</th>
                            <th className="py-2 pr-2">SKU</th>
                            <th className="py-2 pr-2">Stock</th>
                            <th className="py-2 pr-2">Default</th>
                            <th className="py-2 pr-2">Available</th>
                            <th className="py-2 pr-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(group.options || []).map((option, optionIndex) => (
                            <tr key={option._id || optionIndex} className="border-b border-gray-100">
                              <td className="py-2 pr-2">
                                <input
                                  value={option.name || ''}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { name: e.target.value })}
                                  className="w-36 rounded border border-gray-200 px-2 py-1"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={option.additionalPrice ?? 0}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { additionalPrice: Number(e.target.value) })}
                                  className="w-24 rounded border border-gray-200 px-2 py-1"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={option.discountedPrice ?? ''}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { discountedPrice: e.target.value === '' ? null : Number(e.target.value) })}
                                  className="w-24 rounded border border-gray-200 px-2 py-1"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  value={option.sku || ''}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { sku: e.target.value })}
                                  className="w-28 rounded border border-gray-200 px-2 py-1"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={option.stockQuantity ?? ''}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { stockQuantity: e.target.value === '' ? null : Number(e.target.value), trackInventory: e.target.value !== '' })}
                                  className="w-24 rounded border border-gray-200 px-2 py-1"
                                />
                              </td>
                              <td className="py-2 pr-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={option.isDefault === true}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { isDefault: e.target.checked })}
                                />
                              </td>
                              <td className="py-2 pr-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={option.isAvailable !== false}
                                  onChange={(e) => updateVariationOption(groupIndex, optionIndex, { isAvailable: e.target.checked })}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <button type="button" onClick={() => removeVariationOption(groupIndex, optionIndex)} className="text-xs font-bold text-red-600">
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => addVariationOption(groupIndex)}>
                        Add option
                      </Button>
                      <Button type="button" variant="danger" onClick={() => removeVariationGroup(groupIndex)}>
                        Remove group
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isAvailable')} className="w-4 h-4" defaultChecked />
              <span className="text-sm text-gray-700">Available</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Item
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`${restaurantBase}/menu`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default MenuItemForm
