import React from 'react'
import Button from '../common/Button'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

function money(invoice, value) {
  const sym = invoice?.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
  const n = Number(value)
  if (Number.isNaN(n)) return `${sym}0.00`
  return `${sym}${n.toFixed(2)}`
}

/**
 * Compliance-oriented invoice / bill layout (screen + print).
 */
export default function InvoiceDocument({ invoice, onBack }) {
  if (!invoice) return null

  const issuer = invoice.issuerSnapshot || {}
  const customer = invoice.customerSnapshot || {}
  const inclusive = issuer.pricesAreVatInclusive !== false
  const hasSeparateVatLines = (invoice.lineItems || []).length >= 2

  return (
    <div className="invoice-print-root max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm print:shadow-none print:border-0">
      <div className="p-6 print:p-4 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax invoice / Bill</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Issued {formatters.datetime(invoice.issuedAt || invoice.createdAt)}
          </p>
          <p className="text-sm text-gray-600">
            Service period{' '}
            {formatters.date(invoice.billingPeriodStart)} — {formatters.date(invoice.billingPeriodEnd)}
          </p>
        </div>
        <div className="text-right text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{issuer.companyLegalName || 'Platform'}</p>
          {issuer.companyAddress ? (
            <p className="whitespace-pre-line mt-1 max-w-xs ml-auto">{issuer.companyAddress}</p>
          ) : null}
          {issuer.companyTaxId ? (
            <p className="mt-2">
              {issuer.taxIdLabel || 'Tax ID'}: {issuer.companyTaxId}
            </p>
          ) : null}
        </div>
      </div>

      <div className="p-6 print:p-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Billed to</p>
          <p className="font-medium text-gray-900 mt-1">{customer.name}</p>
          <p className="text-sm text-gray-600">{customer.email}</p>
          <p className="text-sm text-gray-600">{customer.phone}</p>
          {[customer.address, customer.city, customer.state, customer.pincode, customer.country]
            .filter(Boolean)
            .length > 0 && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
              {[customer.address, [customer.city, customer.state].filter(Boolean).join(', '), customer.pincode, customer.country]
                .filter(Boolean)
                .join('\n')}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-700">
          <p>
            <span className="text-gray-500">Transaction:</span>{' '}
            <span className="capitalize">{invoice.transactionType}</span>
          </p>
          <p>
            <span className="text-gray-500">Payment:</span> {invoice.paymentMethod || '—'}
          </p>
          {invoice.subscriptionPlan?.name && (
            <p>
              <span className="text-gray-500">Plan:</span> {invoice.subscriptionPlan.name}
            </p>
          )}
        </div>
      </div>

      <div className="p-6 print:p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 uppercase text-xs">
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(invoice.lineItems || []).map((line, i) => (
              <tr key={i}>
                <td className="py-3 pr-4 text-gray-900">{line.description}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{line.quantity}</td>
                <td className="py-3 text-right text-gray-900">{money(invoice, line.lineTotalInclVat)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-2 text-sm max-w-sm ml-auto">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (excl. {issuer.taxIdLabel?.includes('VAT') ? 'VAT' : 'tax'})</span>
            <span>{money(invoice, invoice.subtotalExclVat)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>
              {issuer.taxIdLabel || 'VAT'} ({Number(invoice.vatRateApplied || 0).toFixed(2)}%)
              {inclusive && !hasSeparateVatLines ? ' — amount includes tax' : ''}
            </span>
            <span>{money(invoice, invoice.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Grand total</span>
            <span>{money(invoice, invoice.totalInclVat)}</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-500 print:mt-6">
          This document is generated for subscription billing. Retain a copy for your records and tax compliance.
        </p>
      </div>

      <div className="px-6 pb-6 flex flex-wrap gap-3 print:hidden">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <style>{`
        @media print {
          .invoice-print-root { max-width: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
