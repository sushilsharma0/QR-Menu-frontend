import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchRestaurant()
  }, [])

  const fetchRestaurant = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
      setValue('name', res.data.data.name)
      setValue('phone', res.data.data.phone)
      setValue('address', res.data.data.address)
      setValue('city', res.data.data.city)
      setValue('state', res.data.data.state)
      setValue('pincode', res.data.data.pincode)
      setValue('description', res.data.data.description)
      setValue('openingTime', res.data.data.openingTime)
      setValue('closingTime', res.data.data.closingTime)
    } catch (error) {
      toast.error('Failed to fetch restaurant settings')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.put('/restaurant/auth/profile', data)
      toast.success('Settings updated successfully')
      fetchRestaurant()
    } catch (error) {
      toast.error('Failed to update settings')
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="text-gray-500 mt-1">Manage your restaurant information</p>
      </div>

      <Card title="General Information">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Restaurant Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
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
          <Button type="submit" loading={loading}>Save Changes</Button>
        </form>
      </Card>

      <Card title="Subscription Settings">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Auto-renew Subscription</p>
            <p className="text-sm text-gray-500">Automatically renew your plan when it expires</p>
          </div>
          <button
            onClick={toggleAutoRenew}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              restaurant?.autoRenew ? 'bg-primary-600' : 'bg-gray-200'
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
    </div>
  )
}

export default Settings