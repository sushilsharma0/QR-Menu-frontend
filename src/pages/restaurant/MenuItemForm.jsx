import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Textarea from '../../components/common/Textarea'

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
      setValue('isVegetarian', item.isVegetarian)
      setValue('isSpicy', item.isSpicy)
      setValue('isAvailable', item.isAvailable)
      setDietaryTags(Array.isArray(item.dietaryTags) ? item.dietaryTags : [])
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
      if (data.isVegetarian) formData.append('isVegetarian', data.isVegetarian)
      if (data.isSpicy) formData.append('isSpicy', data.isSpicy)
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

      // Append image file if selected
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      console.log('Submitting with file:', selectedFile)

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
      console.log('File selected:', file.name, file.size)
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
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

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isVegetarian')} className="w-4 h-4" />
              <span className="text-sm text-gray-700">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isSpicy')} className="w-4 h-4" />
              <span className="text-sm text-gray-700">Spicy</span>
            </label>
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