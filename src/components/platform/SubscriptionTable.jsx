import React from 'react'
import Table from '../common/Table'
import Badge from '../common/Badge'

const SubscriptionTable = ({ subscriptions, loading }) => {
  const columns = [
    { header: 'Plan Name', accessor: 'name' },
    { header: 'Type', accessor: 'planType', render: (row) => <Badge>{row.planType}</Badge> },
    { header: 'Duration', accessor: 'durationLabel' },
    { header: 'Price', accessor: 'price', render: (row) => `$${row.price}` },
    { header: 'Active Subscribers', accessor: 'count' },
  ]

  return <Table columns={columns} data={subscriptions} loading={loading} />
}

export default SubscriptionTable