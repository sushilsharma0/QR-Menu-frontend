import React from 'react'
import Table from '../common/Table'
import Badge from '../common/Badge'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const SubscriptionTable = ({ subscriptions, loading }) => {
  const columns = [
    { header: 'Plan Name', accessor: 'name' },
    { header: 'Type', accessor: 'planType', render: (row) => <Badge>{row.planType}</Badge> },
    { header: 'Duration', accessor: 'durationLabel' },
    {
      header: 'Price (incl. VAT)',
      accessor: 'price',
      render: (row) => {
        const sym = row.pricing?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
        const n = row.pricing?.totalInclVat ?? row.price
        return `${sym}${Number(n).toFixed(2)}`
      },
    },
    { header: 'Active Subscribers', accessor: 'count' },
  ]

  return <Table columns={columns} data={subscriptions} loading={loading} />
}

export default SubscriptionTable