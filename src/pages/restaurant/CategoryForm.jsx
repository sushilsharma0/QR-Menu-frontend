import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const CategoryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (id) fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      const res = await api.get(`/restaurant/menu/categories/${id}`)
      const category = res.data.data
      setValue('name', category.name)
      setValue('description', category.description)
      setValue('sortOrder', category.sortOrder)
      if (category.image) setImagePreview(category.image)
    } catch (error) {
      toast.error('Failed to fetch category')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      const formData = new FormData()

      // Append normal fields
      Object.keys(data).forEach((key) => {
        if (key !== 'image' && data[key] !== undefined) {
          formData.append(key, data[key])
        }
      })

      // Append image file
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0])
      }

      if (id) {
        await api.put(`/restaurant/menu/categories/${id}`, formData)
        toast.success('Category updated')
      } else {
        await api.post('/restaurant/menu/categories', formData)
        toast.success('Category created')
      }
      navigate('/restaurant/menu')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit' : 'Add'} Category</h1>
        <p className="text-gray-500 mt-1">Create or update menu category</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Category Name"
            placeholder="Enter category name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Description"
            placeholder="Enter description (optional)"
            {...register('description')}
            error={errors.description?.message}
          />

          <Input
            label="Sort Order"
            type="number"
            placeholder="0"
            {...register('sortOrder')}
            error={errors.sortOrder?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="mx-auto h-32 w-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="image"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          {...register('image')}
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Category
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

export default CategoryForm