import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiEye } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [backgroundPreview, setBackgroundPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(false)
  const { mergeUser } = useAuth()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchRestaurant()
  }, [])

  const fetchRestaurant = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
      
      // Set form values (name is read-only)
      setValue('name', res.data.data.name)
      setValue('phone', res.data.data.phone)
      setValue('address', res.data.data.address)
      setValue('city', res.data.data.city)
      setValue('state', res.data.data.state)
      setValue('pincode', res.data.data.pincode)
      setValue('description', res.data.data.description)
      setValue('openingTime', res.data.data.openingTime)
      setValue('closingTime', res.data.data.closingTime)
      
      // Set logo and background previews
      if (res.data.data.logo) {
        setLogoPreview(res.data.data.logo)
      }
      if (res.data.data.backgroundPhoto) {
        setBackgroundPreview(res.data.data.backgroundPhoto)
      }
    } catch (error) {
      toast.error('Failed to fetch restaurant settings')
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB')
      return
    }
    
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Background photo must be less than 10MB')
      return
    }
    
    setBackgroundFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setBackgroundPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (restaurant?.logo) setLogoPreview(restaurant.logo)
  }

  const clearBackground = () => {
    setBackgroundFile(null)
    setBackgroundPreview(null)
    if (restaurant?.backgroundPhoto) setBackgroundPreview(restaurant.backgroundPhoto)
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      
      // Add text fields
      formData.append('phone', data.phone)
      formData.append('address', data.address)
      formData.append('city', data.city)
      formData.append('state', data.state)
      formData.append('pincode', data.pincode)
      formData.append('description', data.description)
      formData.append('openingTime', data.openingTime)
      formData.append('closingTime', data.closingTime)
      
      // Add file fields if present
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      if (backgroundFile) {
        formData.append('backgroundPhoto', backgroundFile)
      }
      
      const response = await api.put('/restaurant/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const updatedRestaurant = response.data?.data
      if (updatedRestaurant) {
        mergeUser({
          name: updatedRestaurant.name,
          phone: updatedRestaurant.phone,
          logo: updatedRestaurant.logo,
          slug: updatedRestaurant.slug,
          currency: updatedRestaurant?.settings?.currency,
        })
      }
      
      toast.success('Settings updated successfully')
      setLogoFile(null)
      setBackgroundFile(null)
      await fetchRestaurant()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleAutoRenew = async () => {
    try {
      await api.patch('/restaurant/package/auto-renew', { autoRenew: !restaurant?.autoRenew })
      toast.success(`Auto-renew ${!restaurant?.autoRenew ? 'enabled' : 'disabled'}`)
      fetchRestaurant()
    } catch (error) {
      toast.error('Failed to update auto-renew')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Restaurant Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your restaurant profile, header photo, and customer-facing branding</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Restaurant Name - Read Only */}
        <Card title="Restaurant Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Restaurant Name <span className="text-xs text-gray-500 dark:text-gray-400">(Read-only - Registered from PAN)</span>
              </label>
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-medium cursor-not-allowed">
                {restaurant?.name || 'Loading...'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your restaurant name is registered from your PAN and cannot be changed
              </p>
            </div>
            
            <Input
              label="Phone Number"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" {...register('city')} />
              <Input label="State" {...register('state')} />
            </div>
            
            <Input label="Pincode" {...register('pincode')} />
            <Input
              label="Description"
              placeholder="Brief description of your restaurant"
              {...register('description')}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Time" type="time" {...register('openingTime')} />
              <Input label="Closing Time" type="time" {...register('closingTime')} />
            </div>
          </div>
        </Card>

        {/* Logo Upload */}
        <Card title="Profile Photo / Restaurant Logo">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload your restaurant profile image. It appears in the dashboard header, profile dropdown, QR printouts, and customer-facing surfaces.
            </p>
            
            {/* Logo Preview */}
            {logoPreview && (
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoPreview(true)}
                  className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiEye size={16} />
                </button>
              </div>
            )}
            
            {/* Logo Upload Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-input"
              />
              <label htmlFor="logo-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload logo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </label>
            </div>
            
            {logoFile && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Logo ready to upload: {logoFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="p-1 hover:bg-green-200 rounded transition"
                >
                  <FiX size={16} className="text-green-600" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Background Photo Upload */}
        <Card title="Customer Panel Background">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload a background photo that will be displayed in the customer panel. Recommended size: 1920x1080px.
            </p>
            
            {/* Background Preview */}
            {backgroundPreview && (
              <div className="relative inline-block w-full">
                <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackgroundPreview(true)}
                  className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiEye size={16} />
                </button>
              </div>
            )}
            
            {/* Background Upload Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundChange}
                className="hidden"
                id="background-input"
              />
              <label htmlFor="background-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload background photo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </label>
            </div>
            
            {backgroundFile && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Background ready to upload: {backgroundFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearBackground}
                  className="p-1 hover:bg-green-200 rounded transition"
                >
                  <FiX size={16} className="text-green-600" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Save All Changes
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Subscription Settings */}
      <Card title="Subscription Settings">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Auto-renew Subscription</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically renew your plan when it expires</p>
          </div>
          <button
            onClick={toggleAutoRenew}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              restaurant?.autoRenew ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                restaurant?.autoRenew ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Image Preview Modals */}
      {showLogoPreview && logoPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Logo Preview</h3>
              <button
                onClick={() => setShowLogoPreview(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              <img src={logoPreview} alt="Logo" className="max-w-full max-h-96 object-contain" />
            </div>
          </div>
        </div>
      )}

      {showBackgroundPreview && backgroundPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Background Preview</h3>
              <button
                onClick={() => setShowBackgroundPreview(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              <img src={backgroundPreview} alt="Background" className="max-w-full max-h-96 object-cover rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
