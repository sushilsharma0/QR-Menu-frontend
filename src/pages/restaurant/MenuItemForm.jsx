import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const MenuItemForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

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
      setValue('category', item.category)
      setValue('description', item.description)
      setValue('price', item.price)
      setValue('originalPrice', item.originalPrice)
      setValue('preparationTime', item.preparationTime)
      setValue('taxRate', item.taxRate)
      setValue('isVegetarian', item.isVegetarian)
      setValue('isSpicy', item.isSpicy)
      setValue('isAvailable', item.isAvailable)
      if (item.image) setImagePreview(item.image)
    } catch (error) {
      toast.error('Failed to fetch menu item')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && key !== 'image') {
          formData.append(key, data[key])
        }
      })
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0])
      }

      if (id) {
        await api.put(`/restaurant/menu/items/${id}`, data)
        toast.success('Menu item updated')
      } else {
        await api.post('/restaurant/menu/items', data)
        toast.success('Menu item created')
      }
      navigate('/restaurant/menu')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
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

          <Input
            label="Description"
            placeholder="Enter description"
            {...register('description')}
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
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
              className="w-full"
              {...register('image')}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
            )}
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
            <Button type="button" variant="secondary" onClick={() => navigate('/restaurant/menu')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default MenuItemForm