import React from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../common/Table'
import Badge from '../common/Badge'

const RestaurantTable = ({ restaurants, loading }) => {
  const navigate = useNavigate()

  const columns = [
    { header: 'Restaurant', accessor: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        {row.logo ? (
          <img src={row.logo} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">{row.name?.charAt(0)}</span>
          </div>
        )}
        <span className="font-medium">{row.name}</span>
      </div>
    ) },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'KYC Status', accessor: 'kycStatus', render: (row) => {
      const statusMap = {
        approved: { label: 'Approved', variant: 'success' },
        pending: { label: 'Pending', variant: 'warning' },
        rejected: { label: 'Rejected', variant: 'danger' },
        not_submitted: { label: 'Not Submitted', variant: 'default' }
      }
      const status = statusMap[row.kycStatus] || statusMap.not_submitted
      return <Badge variant={status.variant}>{status.label}</Badge>
    } },
    { header: 'Status', accessor: 'isActive', render: (row) => (
      <Badge variant={row.isActive ? 'success' : 'danger'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ) },
    { header: 'Joined', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <Table
      columns={columns}
      data={restaurants}
      loading={loading}
      onRowClick={(row) => navigate(`/platform/restaurants/${row._id}`)}
    />
  )
}

export default RestaurantTable