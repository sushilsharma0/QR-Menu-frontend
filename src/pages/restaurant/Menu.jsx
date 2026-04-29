import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'

const Menu = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '', name: '' })
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, itemsRes] = await Promise.all([
        api.get('/restaurant/menu/categories'),
        api.get('/restaurant/menu/items'),
      ])
      setCategories(categoriesRes.data.data)
      setItems(itemsRes.data.data)
    } catch (error) {
      toast.error('Failed to fetch menu data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    try {
      await api.delete(`/restaurant/menu/categories/${deleteModal.id}`)
      toast.success('Category deleted successfully')
      fetchMenuData()
      setDeleteModal({ open: false, type: '', id: '', name: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const handleDeleteItem = async () => {
    try {
      await api.delete(`/restaurant/menu/items/${deleteModal.id}`)
      toast.success('Menu item deleted successfully')
      fetchMenuData()
      setDeleteModal({ open: false, type: '', id: '', name: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete menu item')
    }
  }

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await api.patch(`/restaurant/menu/items/${itemId}/toggle-availability`)
      toast.success(`Item ${currentStatus ? 'unavailable' : 'available'} now`)
      fetchMenuData()
    } catch (error) {
      toast.error('Failed to update item status')
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant menu categories and items</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/restaurant/menu/category/new')}>
            <FiPlus className="mr-2" /> Add Category
          </Button>
          <Button onClick={() => navigate('/restaurant/menu/item/new')}>
            <FiPlus className="mr-2" /> Add Menu Item
          </Button>
        </div>
      </div>

      {/* Categories Section */}
      <Card title="Categories">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div 
            onClick={() => setSelectedCategory('all')}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'all' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900">All Items</h3>
            <p className="text-sm text-gray-500 mt-1">{items.length} items</p>
          </div>
          {categories.map((category) => (
            <div 
              key={category._id}
              onClick={() => setSelectedCategory(category._id)}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === category._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {items.filter(i => i.category === category._id).length} items
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/restaurant/menu/category/${category._id}/edit`); }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, type: 'category', id: category._id, name: category.name }); }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No categories yet. Click "Add Category" to create one.
            </div>
          )}
        </div>
      </Card>

      {/* Menu Items Section */}
      <Card title="Menu Items">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const category = categories.find(c => c._id === item.category)
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-gray-900">${item.price}</span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">${item.originalPrice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                          className="text-gray-400 hover:text-yellow-600 transition-colors"
                          title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                        >
                          {item.isAvailable ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => navigate(`/restaurant/menu/item/${item._id}/edit`)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, type: 'item', id: item._id, name: item.name })}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No menu items found in this category. Click "Add Menu Item" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: '', id: '', name: '' })}
        title={`Delete ${deleteModal.type === 'category' ? 'Category' : 'Menu Item'}`}
      >
        <div className="p-6">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.name}</strong>?
            {deleteModal.type === 'category' && ' Items in this category will not be deleted.'}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, type: '', id: '', name: '' })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteModal.type === 'category' ? handleDeleteCategory : handleDeleteItem}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Menu