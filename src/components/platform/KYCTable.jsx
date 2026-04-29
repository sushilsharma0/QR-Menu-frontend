import React from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../common/Table'
import Badge from '../common/Badge'
import Button from '../common/Button'

const KYCTable = ({ applications, loading }) => {
  const navigate = useNavigate()

  const columns = [
    { header: 'Restaurant', accessor: 'restaurant', render: (row) => row.restaurant?.name },
    { header: 'Owner Name', accessor: 'ownerName' },
    { header: 'ID Type', accessor: 'idType' },
    { header: 'ID Number', accessor: 'idNumber' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={row.status === 'pending' ? 'warning' : row.status === 'approved' ? 'success' : 'danger'}>
        {row.status.toUpperCase()}
      </Badge>
    ) },
    { header: 'Submitted', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: '_id', render: (row) => (
      <Button size="sm" onClick={() => navigate(`/platform/kyc/${row._id}`)}>Review</Button>
    ) },
  ]

  return <Table columns={columns} data={applications} loading={loading} />
}

export default KYCTable