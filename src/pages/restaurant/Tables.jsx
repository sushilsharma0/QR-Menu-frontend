import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiCode, FiImage, FiPrinter } from 'react-icons/fi'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Loader from '../../components/common/Loader'

const Tables = () => {
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrModal, setQrModal] = useState({ open: false, table: null })

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/tables')
      console.log('Tables response:', res.data)
      setTables(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch tables:', error)
      toast.error('Failed to fetch tables')
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return
    try {
      await api.delete(`/restaurant/tables/${id}`)
      toast.success('Table deleted')
      fetchTables()
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  const handleRegenerateQR = async (id) => {
    try {
      await api.patch(`/restaurant/tables/${id}/regenerate-qr`)
      toast.success('QR code regenerated')
      fetchTables()
    } catch (error) {
      toast.error('Failed to regenerate QR code')
    }
  }

  const getQRUrl = (table) => {
    // Get restaurant slug from localStorage or use default
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const restaurantSlug = user.slug || 'restaurant'
    
    if (!table.qrToken) {
      return '#'
    }
    
    const baseUrl = window.location.origin
    return `${baseUrl}/menu/${restaurantSlug}/${table.qrToken}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-500 mt-1">Manage restaurant tables and QR codes</p>
        </div>
        <Button onClick={() => navigate('/restaurant/tables/new')}>
          <FiPlus className="mr-2" /> Add Table
        </Button>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Yet</h3>
            <p className="text-gray-500 mb-4">Create your first table to start accepting orders</p>
            <Button onClick={() => navigate('/restaurant/tables/new')}>
              <FiPlus className="mr-2" /> Add Your First Table
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Card key={table._id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Table {table.tableNumber}</h3>
                  <p className="text-sm text-gray-500">Capacity: {table.capacity || 4} persons</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${table.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {table.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex justify-center mb-4">
                {table.qrCode ? (
                  <img src={table.qrCode} alt={`QR for Table ${table.tableNumber}`} className="w-32 h-32" />
                ) : table.qrToken ? (
                  <div className="w-32 h-32 bg-gray-50 rounded-lg flex items-center justify-center p-2 border border-gray-200">
                    <QRCode value={getQRUrl(table)} size={100} />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <FiImage className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setQrModal({ open: true, table })}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <FiCode className="h-4 w-4" /> View QR
                </button>
                <button
                  onClick={() => handleRegenerateQR(table._id)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Regenerate QR"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate(`/restaurant/tables/${table._id}/edit`)}
                  className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                  title="Edit Table"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(table._id)}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Delete Table"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, table: null })}
        title={`QR Code - Table ${qrModal.table?.tableNumber}`}
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
            {qrModal.table?.qrToken ? (
              <QRCode value={getQRUrl(qrModal.table)} size={200} />
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                No QR Code Available
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">Scan this QR code to view menu and place orders</p>
          
          {qrModal.table?.qrToken && (
            <>
              <div className="bg-gray-100 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-600 break-all">{getQRUrl(qrModal.table)}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(getQRUrl(qrModal.table))
                    toast.success('URL copied to clipboard')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Copy URL
                </Button>
                <Button
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>QR Code - Table ${qrModal.table?.tableNumber}</title>
                          <style>
                            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; flex-direction: column; font-family: Arial, sans-serif; }
                            .container { text-align: center; }
                            img { width: 300px; height: 300px; }
                            h2 { margin-top: 20px; color: #333; }
                            p { color: #666; }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <img src="${qrModal.table?.qrCode}" alt="QR Code" />
                            <h2>Table ${qrModal.table?.tableNumber}</h2>
                            <p>Scan to view menu and place orders</p>
                          </div>
                          <script>window.print();</script>
                        </body>
                      </html>
                    `)
                    printWindow.document.close()
                  }}
                  size="sm"
                >
                  <FiPrinter className="mr-2" /> Print QR
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Tables