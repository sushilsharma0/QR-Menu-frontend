import React, { useReducer, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import MenuImageSuggestions from '../../components/restaurant/MenuImageSuggestions'
import DescriptionFieldWithSuggestion from '../../components/restaurant/DescriptionFieldWithSuggestion'
import VariationSuggestionsPanel from '../../components/restaurant/VariationSuggestionsPanel'
import { useMenuImageSuggestions } from '../../hooks/useMenuImageSuggestions'
import { isTierPricingGroup } from '../../utils/menuVariationSuggestions'

const IMAGE_MAX_BYTES = 1 * 1024 * 1024
const createClientKey = () => `client-${Date.now()}-${Math.random().toString(36).slice(2)}`

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

const initialNutrition = { calories: '', protein: '', carbs: '', fat: '', fiber: '' }

const initialState = {
  loading: false,
  categories: [],
  imagePreview: null,
  dietaryTags: [],
  variationGroups: [],
  nutrition: initialNutrition,
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'setLoading': return { ...state, loading: action.value }
    case 'setCategories': return { ...state, categories: action.value }
    case 'setImagePreview': return { ...state, imagePreview: action.value }
    case 'setDietaryTags': return { ...state, dietaryTags: action.value }
    case 'setVariationGroups': return { ...state, variationGroups: action.value }
    case 'setNutrition': return { ...state, nutrition: action.value }
    case 'patchNutrition': return { ...state, nutrition: { ...state.nutrition, [action.field]: action.value } }
    default: return state
  }
}

const DietaryTagsField = ({ dietaryTags, onToggle }) => (
  <div>
    <div className="block text-sm font-medium text-gray-700 mb-2">
      Type tags
      <span className="ml-2 text-xs text-gray-400">
        (Customers filter the menu using these; pick all that apply)
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {DIETARY_TAG_OPTIONS.map((opt) => {
        const active = dietaryTags.includes(opt.value)
        const palette = TAG_COLOR_CLASS[opt.color] || TAG_COLOR_CLASS.green
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
              active ? `${palette} ring-2` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  </div>
)

const NutritionFields = ({ nutrition, onChange }) => (
  <div>
    <div className="block text-sm font-medium text-gray-700 mb-2">
      Nutrition (per serving)
      <span className="ml-2 text-xs text-gray-400">
        Optional: leave blank to hide the panel on the customer detail page.
      </span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {[
        ['calories', 'Calories (kcal)', '420'],
        ['protein', 'Protein (g)', '18'],
        ['carbs', 'Carbs (g)', '52'],
        ['fat', 'Fat (g)', '16'],
        ['fiber', 'Fiber (g)', '3'],
      ].map(([field, label, placeholder]) => (
        <Input
          key={field}
          label={label}
          type="number"
          min="0"
          placeholder={placeholder}
          value={nutrition[field]}
          onChange={(e) => onChange(field, e.target.value)}
        />
      ))}
    </div>
  </div>
)

const ImageField = ({ imagePreview, onChange, onRemove }) => (
  <div>
    <label htmlFor="menu-item-image" className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
    <p className="mb-2 text-xs text-gray-500">Recommended square food photo: 800x800 px. Max 1 MB.</p>
    {imagePreview ? (
      <div className="relative inline-block">
        <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
        <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs">
          ×
        </button>
      </div>
    ) : (
      <input id="menu-item-image" type="file" accept="image/*" onChange={onChange} className="w-full" />
    )}
  </div>
)

const VariationGroupCard = ({ group, groupIndex, actions }) => {
  const tierMode = isTierPricingGroup(group)
  return (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <Input label="Group name" value={group.name || ''} onChange={(e) => actions.updateGroup(groupIndex, { name: e.target.value })} />
      <div>
        <label htmlFor={`variation-group-${groupIndex}-type`} className="mb-1 block text-sm font-medium text-gray-700">Type</label>
        <select id={`variation-group-${groupIndex}-type`} value={group.type || 'custom'} onChange={(e) => actions.updateGroup(groupIndex, { type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500">
          {['size', 'portion', 'volume', 'weight', 'pieces', 'combo', 'temperature', 'flavor', 'spice', 'crust', 'preparation', 'addon', 'topping', 'custom'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`variation-group-${groupIndex}-selection`} className="mb-1 block text-sm font-medium text-gray-700">Selection</label>
        <select id={`variation-group-${groupIndex}-selection`} value={group.selectionType || 'single'} onChange={(e) => actions.updateSelection(groupIndex, group, e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500">
          <option value="single">Single</option>
          <option value="multiple">Multiple</option>
          <option value="quantity">Quantity add-on</option>
        </select>
      </div>
      <div>
        <label htmlFor={`variation-group-${groupIndex}-display`} className="mb-1 block text-sm font-medium text-gray-700">Display</label>
        <select id={`variation-group-${groupIndex}-display`} value={group.displayType || 'chips'} onChange={(e) => actions.updateGroup(groupIndex, { displayType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500">
          {['radio', 'dropdown', 'chips', 'cards', 'image', 'checkbox', 'toggle', 'stepper'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`variation-group-${groupIndex}-pricing`} className="mb-1 block text-sm font-medium text-gray-700">Pricing</label>
        <select
          id={`variation-group-${groupIndex}-pricing`}
          value={group.pricingMode || (tierMode ? 'tier' : 'additive')}
          onChange={(e) => actions.updateGroup(groupIndex, { pricingMode: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
        >
          <option value="tier">Full price per option (half / full plate)</option>
          <option value="additive">Add to base price (+ Rs.)</option>
        </select>
      </div>
    </div>
    {tierMode && (
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
        Tier pricing: each option&apos;s price is what the customer pays (e.g. half plate Rs. 150, full plate Rs. 300). Base item price is ignored when they choose a portion.
      </p>
    )}

    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <input type="checkbox" checked={group.isRequired === true} onChange={(e) => actions.updateGroup(groupIndex, { isRequired: e.target.checked, minSelection: e.target.checked ? Math.max(1, Number(group.minSelection || 1)) : 0 })} />
        Required
      </label>
      <Input label="Min" type="number" min="0" value={group.minSelection ?? 0} onChange={(e) => actions.updateGroup(groupIndex, { minSelection: Number(e.target.value) })} />
      <Input label="Max" type="number" min="1" disabled={(group.selectionType || 'single') === 'single'} value={group.maxSelection ?? 1} onChange={(e) => actions.updateGroup(groupIndex, { maxSelection: (group.selectionType || 'single') === 'single' ? 1 : Number(e.target.value) })} />
      <Button type="button" variant="secondary" onClick={() => actions.moveGroup(groupIndex, -1)}>Up</Button>
      <Button type="button" variant="secondary" onClick={() => actions.moveGroup(groupIndex, 1)}>Down</Button>
    </div>

    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-gray-500">
            {['Option', tierMode ? 'Price (Rs.)' : '+ Price', 'Discount', 'SKU', 'Stock', 'Default', 'Available', ''].map((heading) => <th key={heading} className="py-2 pr-2">{heading}</th>)}
          </tr>
        </thead>
        <tbody>
          {(group.options || []).map((option, optionIndex) => (
            <tr key={option._id || option.clientKey || `option-${optionIndex}`} className="border-b border-gray-100">
              <td className="py-2 pr-2"><input value={option.name || ''} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { name: e.target.value })} className="w-36 rounded border border-gray-200 px-2 py-1" /></td>
              <td className="py-2 pr-2"><input type="number" min="0" value={option.additionalPrice ?? 0} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { additionalPrice: Number(e.target.value) })} className="w-24 rounded border border-gray-200 px-2 py-1" /></td>
              <td className="py-2 pr-2"><input type="number" min="0" value={option.discountedPrice ?? ''} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { discountedPrice: e.target.value === '' ? null : Number(e.target.value) })} className="w-24 rounded border border-gray-200 px-2 py-1" /></td>
              <td className="py-2 pr-2"><input value={option.sku || ''} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { sku: e.target.value })} className="w-28 rounded border border-gray-200 px-2 py-1" /></td>
              <td className="py-2 pr-2"><input type="number" min="0" value={option.stockQuantity ?? ''} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { stockQuantity: e.target.value === '' ? null : Number(e.target.value), trackInventory: e.target.value !== '' })} className="w-24 rounded border border-gray-200 px-2 py-1" /></td>
              <td className="py-2 pr-2 text-center"><input type="checkbox" checked={option.isDefault === true} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { isDefault: e.target.checked })} /></td>
              <td className="py-2 pr-2 text-center"><input type="checkbox" checked={option.isAvailable !== false} onChange={(e) => actions.updateOption(groupIndex, optionIndex, { isAvailable: e.target.checked })} /></td>
              <td className="py-2 pr-2"><button type="button" onClick={() => actions.removeOption(groupIndex, optionIndex)} className="text-xs font-bold text-red-600">Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => actions.addOption(groupIndex)}>Add option</Button>
      <Button type="button" variant="danger" onClick={() => actions.removeGroup(groupIndex)}>Remove group</Button>
    </div>
  </div>
  )
}

const VariationsEditor = ({ variationGroups, actions }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Variations and add-ons</h2>
        <p className="text-xs text-gray-500">Build dynamic sizes, portions, volumes, toppings, spice levels, and quantity add-ons.</p>
      </div>
      <Button type="button" size="sm" onClick={actions.addGroup}>Add group</Button>
    </div>
    <div className="mt-4 space-y-4">
      {variationGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">No variations. Customers will order this item at the base price.</div>
      ) : (
        variationGroups.map((group, groupIndex) => <VariationGroupCard key={group._id || group.clientKey || `group-${groupIndex}`} group={group} groupIndex={groupIndex} actions={actions} />)
      )}
    </div>
  </div>
)

const MenuItemForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const selectedFileRef = useRef(null)
  const [state, dispatch] = useReducer(reducer, initialState)
  const { loading, categories, imagePreview, dietaryTags, variationGroups, nutrition } = state
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm()
  const watchedName = watch('name', '')
  const watchedCategoryId = watch('category', '')
  const watchedPrice = watch('price', '')
  const categoryName = categories.find((cat) => String(cat._id) === String(watchedCategoryId))?.name || ''
  const imageSuggestionQuery = String(watchedName || '').trim()
  const {
    suggestions: imageSuggestions,
    loading: imageSuggestionsLoading,
    failedIds: failedSuggestionIds,
    markImageFailed: handleSuggestionImageError,
    query: imageSuggestionQueryLabel,
  } = useMenuImageSuggestions(imageSuggestionQuery)

  const setVariationGroups = (value) => dispatch({ type: 'setVariationGroups', value })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/restaurant/menu/categories')
        dispatch({ type: 'setCategories', value: res.data.data })
      } catch (error) {
        toast.error('Failed to fetch categories')
      }
    }

    const fetchMenuItem = async () => {
      try {
        const res = await api.get(`/restaurant/menu/items/${id}`)
        const item = res.data.data
        const categoryId = item.category && typeof item.category === 'object' ? item.category._id : item.category
        setValue('name', item.name)
        setValue('category', categoryId != null ? String(categoryId) : '')
        setValue('description', item.description)
        setValue('price', item.price)
        setValue('originalPrice', item.originalPrice)
        setValue('preparationTime', item.preparationTime)
        setValue('taxRate', item.taxRate)
        setValue('isAvailable', item.isAvailable)
        setValue('imageUrl', item.image || '')
        dispatch({ type: 'setDietaryTags', value: Array.isArray(item.dietaryTags) ? item.dietaryTags : [] })
        setVariationGroups(Array.isArray(item.variationGroups) ? item.variationGroups : [])
        const n = item.nutrition || {}
        dispatch({ type: 'setNutrition', value: { calories: n.calories ?? '', protein: n.protein ?? '', carbs: n.carbs ?? '', fat: n.fat ?? '', fiber: n.fiber ?? '' } })
        if (item.image) dispatch({ type: 'setImagePreview', value: item.image })
      } catch (error) {
        toast.error('Failed to fetch menu item')
      }
    }

    fetchCategories()
    if (id) fetchMenuItem()
  }, [id, setValue])

  const toggleDietaryTag = (value) => {
    dispatch({ type: 'setDietaryTags', value: dietaryTags.includes(value) ? dietaryTags.filter((t) => t !== value) : [...dietaryTags, value] })
  }

  const onSubmit = async (data) => {
    try {
      dispatch({ type: 'setLoading', value: true })
      const formData = new FormData()
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
      formData.append('dietaryTags', JSON.stringify(dietaryTags))
      if (data.imageUrl !== undefined) formData.append('imageUrl', data.imageUrl)

      const cleanNutrition = Object.entries(nutrition).reduce((acc, [key, value]) => {
        const numberValue = value === '' || value == null ? null : Number(value)
        if (numberValue !== null && Number.isFinite(numberValue) && numberValue >= 0) acc[key] = numberValue
        return acc
      }, {})
      formData.append('nutrition', JSON.stringify(cleanNutrition))
      formData.append('variationGroups', JSON.stringify(variationGroups))
      if (selectedFileRef.current) formData.append('image', selectedFileRef.current)

      await api[id ? 'put' : 'post'](id ? `/restaurant/menu/items/${id}` : '/restaurant/menu/items', formData)
      toast.success(id ? 'Menu item updated' : 'Menu item created')
      navigate(`${restaurantBase}/menu`)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      dispatch({ type: 'setLoading', value: false })
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error('Item image must be less than 1 MB')
      e.target.value = ''
      return
    }
    selectedFileRef.current = file
    setValue('imageUrl', '')
    dispatch({ type: 'setImagePreview', value: URL.createObjectURL(file) })
  }

  const handleRemoveImage = () => {
    selectedFileRef.current = null
    setValue('imageUrl', '')
    dispatch({ type: 'setImagePreview', value: null })
  }

  const handleSuggestedImageSelect = (url) => {
    selectedFileRef.current = null
    setValue('imageUrl', url, { shouldDirty: true })
    dispatch({ type: 'setImagePreview', value: url })
  }

  const actions = {
    applySuggestion: (suggestion) => {
      setVariationGroups(suggestion.groups || [])
      if (suggestion.suggestedBasePrice === 0) {
        setValue('price', '0', { shouldDirty: true })
      }
      toast.success(`Applied ${suggestion.label}`)
    },
    addGroup: () => setVariationGroups([
      ...variationGroups,
      {
        clientKey: createClientKey(),
        name: 'Size', type: 'size', pricingMode: 'tier', selectionType: 'single', isRequired: true,
        minSelection: 1, maxSelection: 1, displayType: 'dropdown', sortOrder: variationGroups.length, isActive: true,
        options: [
          { clientKey: createClientKey(), name: 'Regular', additionalPrice: 0, isAvailable: true, isDefault: true },
          { clientKey: createClientKey(), name: 'Large', additionalPrice: 100, isAvailable: true },
        ],
      },
    ]),
    updateGroup: (index, patch) => setVariationGroups(variationGroups.map((group, i) => (i === index ? { ...group, ...patch } : group))),
    updateSelection: (index, group, selectionType) => actions.updateGroup(index, {
      selectionType,
      maxSelection: selectionType === 'single' ? 1 : group.maxSelection || 99,
      displayType: selectionType === 'multiple' ? 'checkbox' : group.displayType || 'chips',
    }),
    removeGroup: (index) => setVariationGroups(variationGroups.filter((_, i) => i !== index)),
    moveGroup: (index, direction) => {
      const next = [...variationGroups]
      const target = index + direction
      if (target < 0 || target >= next.length) return
      const [row] = next.splice(index, 1)
      next.splice(target, 0, row)
      setVariationGroups(next.map((group, i) => ({ ...group, sortOrder: i })))
    },
    addOption: (groupIndex) => setVariationGroups(variationGroups.map((group, i) => i === groupIndex ? { ...group, options: [...(group.options || []), { clientKey: createClientKey(), name: 'New option', additionalPrice: 0, isAvailable: true }] } : group)),
    updateOption: (groupIndex, optionIndex, patch) => setVariationGroups(variationGroups.map((group, i) => {
      if (i !== groupIndex) return group
      const options = (group.options || []).reduce((rows, option, j) => {
        const next = j === optionIndex ? { ...option, ...patch } : option
        rows.push(patch.isDefault && group.selectionType === 'single' && j !== optionIndex ? { ...next, isDefault: false } : next)
        return rows
      }, [])
      return { ...group, options }
    })),
    removeOption: (groupIndex, optionIndex) => setVariationGroups(variationGroups.map((group, i) => {
      if (i !== groupIndex) return group
      const options = (group.options || []).reduce((rows, option, j) => {
        if (j !== optionIndex) rows.push(option)
        return rows
      }, [])
      return { ...group, options }
    })),
  }
  const imageUrlField = register('imageUrl')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{id ? 'Edit' : 'Add'} Menu Item</h1>
          <p className="text-gray-500 mt-1">Create or update menu item details</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`${restaurantBase}/menu`)}
          className="self-start"
        >
          Cancel
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Item Name" placeholder="Enter item name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
          <MenuImageSuggestions
            suggestions={imageSuggestions}
            loading={imageSuggestionsLoading}
            query={imageSuggestionQueryLabel}
            failedIds={failedSuggestionIds}
            onImageError={handleSuggestionImageError}
            onSelect={handleSuggestedImageSelect}
          />
          <div>
            <label htmlFor="menu-item-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="menu-item-category" {...register('category', { required: 'Category is required' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Select Category</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>
          <DescriptionFieldWithSuggestion
            label="Description"
            kind="menuItem"
            name={watchedName}
            categoryName={categoryName}
            register={register}
            setValue={setValue}
            watch={watch}
            placeholder="Write something..."
            error={errors.description?.message}
          />
          <VariationSuggestionsPanel
            itemName={watchedName}
            categoryName={categoryName}
            basePrice={watchedPrice}
            variationGroups={variationGroups}
            onApply={actions.applySuggestion}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Base price" type="number" step="0.01" placeholder="0.00" {...register('price', { required: 'Price is required', min: 0 })} error={errors.price?.message} />
              <p className="mt-1 text-xs text-gray-500">
                For half/full plate or pizza sizes, use 0 and set full prices in variations below.
              </p>
            </div>
            <Input label="Original Price (Optional)" type="number" step="0.01" placeholder="0.00" {...register('originalPrice')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preparation Time (minutes)" type="number" placeholder="15" {...register('preparationTime')} />
            <Input label="Tax Rate (%)" type="number" step="0.01" placeholder="0" {...register('taxRate')} />
          </div>
          <Input
            label="Image Link (Optional)"
            type="url"
            placeholder="https://example.com/menu-item.jpg"
            {...imageUrlField}
            onChange={(event) => {
              imageUrlField.onChange(event)
              if (!selectedFileRef.current) dispatch({ type: 'setImagePreview', value: event.target.value.trim() || null })
            }}
          />
          <ImageField imagePreview={imagePreview} onChange={handleImageChange} onRemove={handleRemoveImage} />
          <DietaryTagsField dietaryTags={dietaryTags} onToggle={toggleDietaryTag} />
          <NutritionFields nutrition={nutrition} onChange={(field, value) => dispatch({ type: 'patchNutrition', field, value })} />
          <VariationsEditor variationGroups={variationGroups} actions={actions} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isAvailable')} className="w-4 h-4" defaultChecked />
              <span className="text-sm text-gray-700">Available</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>{id ? 'Update' : 'Create'} Item</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`${restaurantBase}/menu`)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default MenuItemForm
