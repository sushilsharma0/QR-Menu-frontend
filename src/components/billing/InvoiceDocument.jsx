import React from 'react'
import Button from '../common/Button'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

function money(invoice, value) {
  const sym = invoice?.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
  const n = Number(value)
  if (Number.isNaN(n)) return `${sym}0.00`
  return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatTransactionType(type) {
  const map = {
    assigned: 'New subscription',
    renewed: 'Subscription renewal',
    upgraded: 'Plan upgrade',
    downgraded: 'Plan change',
    cancelled: 'Cancellation',
    expired: 'Expired',
  }
  return map[type] || String(type || '—').replace(/_/g, ' ')
}

function formatPaymentMethod(method) {
  const map = {
    online: 'Online payment',
    offline: 'Bank transfer / offline',
    free: 'Complimentary / waived',
  }
  return map[method] || method || '—'
}

function formatAddress(parts) {
  return parts.filter(Boolean).join(', ')
}

function DetailRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="invoice-meta-row">
      <span className="invoice-meta-label">{label}</span>
      <span className="invoice-meta-value">{value}</span>
    </div>
  )
}

/**
 * Professional tax invoice layout for subscription billing (screen + A4 print).
 */
export default function InvoiceDocument({ invoice, onBack }) {
  if (!invoice) return null

  const issuer = invoice.issuerSnapshot || {}
  const customer = invoice.customerSnapshot || {}
  const taxLabel = issuer.taxIdLabel || 'VAT'
  const vatRate = Number(invoice.vatRateApplied || issuer.vatRatePercent || 0)
  const lineItems = invoice.lineItems || []
  const isPaid = invoice.paymentMethod === 'online' || invoice.paymentMethod === 'offline'
  const issuedDate = invoice.issuedAt || invoice.createdAt

  const customerAddress = formatAddress([
    customer.address,
    [customer.city, customer.state].filter(Boolean).join(', '),
    customer.pincode,
    customer.country,
  ])

  return (
    <div className="invoice-page-wrap">
      <article className="invoice-sheet" aria-label={`Invoice ${invoice.invoiceNumber}`}>
        {/* Header band */}
        <header className="invoice-header">
          <div className="invoice-header-left">
            <p className="invoice-brand">{issuer.companyLegalName || 'QR Restro Nepal'}</p>
            {issuer.companyAddress ? (
              <p className="invoice-brand-sub whitespace-pre-line">{issuer.companyAddress}</p>
            ) : null}
            {issuer.companyTaxId ? (
              <p className="invoice-brand-sub">
                {taxLabel}: <strong>{issuer.companyTaxId}</strong>
              </p>
            ) : null}
          </div>
          <div className="invoice-header-right">
            <h1 className="invoice-title">TAX INVOICE</h1>
            <p className="invoice-title-sub">Subscription services</p>
            <span
              className={`invoice-status ${invoice.paymentMethod === 'free' ? 'invoice-status--muted' : 'invoice-status--paid'}`}
            >
              {invoice.paymentMethod === 'free' ? 'No charge' : 'Tax invoice'}
            </span>
          </div>
        </header>

        {/* Invoice meta */}
        <section className="invoice-meta-grid">
          <div className="invoice-meta-box">
            <DetailRow label="Invoice number" value={invoice.invoiceNumber} />
            <DetailRow label="Issue date" value={formatters.date(issuedDate)} />
            <DetailRow label="Issue time" value={formatters.time(issuedDate)} />
          </div>
          <div className="invoice-meta-box">
            <DetailRow
              label="Billing period"
              value={`${formatters.date(invoice.billingPeriodStart)} – ${formatters.date(invoice.billingPeriodEnd)}`}
            />
            <DetailRow label="Transaction" value={formatTransactionType(invoice.transactionType)} />
            <DetailRow label="Payment" value={formatPaymentMethod(invoice.paymentMethod)} />
          </div>
        </section>

        {/* Parties */}
        <section className="invoice-parties">
          <div className="invoice-party">
            <h2 className="invoice-party-title">Sold by</h2>
            <p className="invoice-party-name">{issuer.companyLegalName || 'Platform'}</p>
            {issuer.companyAddress ? (
              <p className="invoice-party-line whitespace-pre-line">{issuer.companyAddress}</p>
            ) : null}
            {issuer.companyTaxId ? (
              <p className="invoice-party-line">
                {taxLabel}: {issuer.companyTaxId}
              </p>
            ) : null}
          </div>
          <div className="invoice-party">
            <h2 className="invoice-party-title">Bill to</h2>
            <p className="invoice-party-name">{customer.name || '—'}</p>
            {customer.email ? <p className="invoice-party-line">{customer.email}</p> : null}
            {customer.phone ? <p className="invoice-party-line">{customer.phone}</p> : null}
            {customerAddress ? <p className="invoice-party-line">{customerAddress}</p> : null}
            {invoice.subscriptionPlan?.name ? (
              <p className="invoice-party-line invoice-party-plan">
                Plan: <strong>{invoice.subscriptionPlan.name}</strong>
              </p>
            ) : null}
          </div>
        </section>

        {/* Line items */}
        <section className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="col-sn">#</th>
                <th className="col-desc">Description of services</th>
                <th className="col-qty">Qty</th>
                <th className="col-rate">Unit price</th>
                <th className="col-amt">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="invoice-empty">
                    Subscription charge
                  </td>
                </tr>
              ) : (
                lineItems.map((line, i) => (
                  <tr key={i}>
                    <td className="col-sn">{i + 1}</td>
                    <td className="col-desc">{line.description}</td>
                    <td className="col-qty">{line.quantity ?? 1}</td>
                    <td className="col-rate">{money(invoice, line.unitPriceInclVat)}</td>
                    <td className="col-amt">{money(invoice, line.lineTotalInclVat)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="invoice-totals-wrap">
          <div className="invoice-totals">
            <div className="invoice-total-row">
              <span>Subtotal (excl. {taxLabel})</span>
              <span>{money(invoice, invoice.subtotalExclVat)}</span>
            </div>
            <div className="invoice-total-row">
              <span>
                {taxLabel} @ {vatRate.toFixed(2)}%
              </span>
              <span>{money(invoice, invoice.vatAmount)}</span>
            </div>
            <div className="invoice-total-row invoice-total-row--grand">
              <span>Total amount due</span>
              <span>{money(invoice, invoice.totalInclVat)}</span>
            </div>
            {issuer.currencyCode ? (
              <p className="invoice-currency-note">Currency: {issuer.currencyCode}</p>
            ) : null}
          </div>
        </section>

        {/* Footer */}
        <footer className="invoice-footer">
          <div className="invoice-footer-col">
            <h3 className="invoice-footer-heading">Terms &amp; notes</h3>
            <ul className="invoice-footer-list">
              <li>This is a computer-generated tax invoice and is valid without a physical signature.</li>
              <li>Service period is shown above. Retain this document for your accounting and tax records.</li>
              {isPaid && invoice.paymentMethod !== 'free' ? (
                <li>Payment received via {formatPaymentMethod(invoice.paymentMethod).toLowerCase()}.</li>
              ) : null}
            </ul>
          </div>
          <div className="invoice-footer-col invoice-footer-sign">
            <p className="invoice-sign-line" />
            <p className="invoice-sign-label">Authorized signature</p>
            <p className="invoice-sign-company">{issuer.companyLegalName || 'Platform'}</p>
          </div>
        </footer>

        <p className="invoice-thanks">Thank you for your business.</p>
      </article>

      <div className="invoice-actions print:hidden">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Print / Download PDF
        </Button>
      </div>

      <style>{`
        .invoice-page-wrap {
          max-width: 52rem;
          margin: 0 auto;
          padding: 1.5rem 1rem 2rem;
        }

        .invoice-sheet {
          background: #fff;
          color: #111827;
          border: 1px solid #d1d5db;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
          font-family: Georgia, 'Times New Roman', Times, serif;
          font-size: 13px;
          line-height: 1.45;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 3px solid #111827;
          background: linear-gradient(180deg, #f9fafb 0%, #fff 100%);
        }

        .invoice-brand {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #111827;
          margin: 0;
        }

        .invoice-brand-sub {
          font-family: system-ui, sans-serif;
          font-size: 11px;
          color: #4b5563;
          margin: 0.35rem 0 0;
          max-width: 16rem;
        }

        .invoice-header-right {
          text-align: right;
        }

        .invoice-title {
          font-family: system-ui, sans-serif;
          font-size: 1.75rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          margin: 0;
          color: #111827;
        }

        .invoice-title-sub {
          font-family: system-ui, sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin: 0.25rem 0 0.5rem;
        }

        .invoice-status {
          display: inline-block;
          font-family: system-ui, sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.55rem;
          border: 1px solid #111827;
        }

        .invoice-status--paid {
          background: #111827;
          color: #fff;
        }

        .invoice-status--muted {
          background: #f3f4f6;
          color: #374151;
          border-color: #9ca3af;
        }

        .invoice-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-meta-box {
          padding: 0.85rem 1.5rem;
          font-family: system-ui, sans-serif;
          font-size: 12px;
        }

        .invoice-meta-box:first-child {
          border-right: 1px solid #e5e7eb;
        }

        .invoice-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.2rem 0;
        }

        .invoice-meta-label {
          color: #6b7280;
          font-weight: 500;
        }

        .invoice-meta-value {
          color: #111827;
          font-weight: 600;
          text-align: right;
        }

        .invoice-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-party {
          padding: 1rem 1.5rem;
          min-height: 7rem;
        }

        .invoice-party:first-child {
          border-right: 1px solid #e5e7eb;
          background: #fafafa;
        }

        .invoice-party-title {
          font-family: system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin: 0 0 0.5rem;
        }

        .invoice-party-name {
          font-family: system-ui, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.35rem;
        }

        .invoice-party-line {
          font-family: system-ui, sans-serif;
          font-size: 12px;
          color: #374151;
          margin: 0.15rem 0;
        }

        .invoice-party-plan {
          margin-top: 0.5rem;
        }

        .invoice-table-wrap {
          padding: 0;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-family: system-ui, sans-serif;
          font-size: 12px;
        }

        .invoice-table thead {
          background: #111827;
          color: #fff;
        }

        .invoice-table th {
          padding: 0.55rem 0.75rem;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .invoice-table th.col-qty,
        .invoice-table th.col-rate,
        .invoice-table th.col-amt {
          text-align: right;
        }

        .invoice-table td {
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
          color: #111827;
        }

        .invoice-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }

        .invoice-table .col-sn {
          width: 2.5rem;
          text-align: center;
          color: #6b7280;
        }

        .invoice-table .col-desc {
          width: auto;
        }

        .invoice-table .col-qty,
        .invoice-table .col-rate,
        .invoice-table .col-amt {
          text-align: right;
          white-space: nowrap;
        }

        .invoice-table .col-amt {
          font-weight: 600;
        }

        .invoice-empty {
          text-align: center;
          color: #6b7280;
          padding: 1.5rem !important;
        }

        .invoice-totals-wrap {
          display: flex;
          justify-content: flex-end;
          padding: 1rem 1.5rem 1.25rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-totals {
          width: 100%;
          max-width: 18rem;
          font-family: system-ui, sans-serif;
          font-size: 12px;
        }

        .invoice-total-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.35rem 0;
          color: #374151;
        }

        .invoice-total-row--grand {
          margin-top: 0.35rem;
          padding: 0.65rem 0.75rem;
          background: #111827;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
        }

        .invoice-currency-note {
          margin: 0.5rem 0 0;
          font-size: 10px;
          color: #9ca3af;
          text-align: right;
        }

        .invoice-footer {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 1.5rem;
          padding: 1rem 1.5rem;
          font-family: system-ui, sans-serif;
          font-size: 11px;
          color: #4b5563;
        }

        .invoice-footer-heading {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #374151;
          margin: 0 0 0.4rem;
        }

        .invoice-footer-list {
          margin: 0;
          padding-left: 1.1rem;
        }

        .invoice-footer-list li {
          margin-bottom: 0.25rem;
        }

        .invoice-footer-sign {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: flex-end;
        }

        .invoice-sign-line {
          width: 10rem;
          border-top: 1px solid #111827;
          margin: 2rem 0 0.35rem;
        }

        .invoice-sign-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
          margin: 0;
        }

        .invoice-sign-company {
          font-size: 11px;
          font-weight: 600;
          color: #111827;
          margin: 0.15rem 0 0;
        }

        .invoice-thanks {
          text-align: center;
          font-family: system-ui, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #9ca3af;
          padding: 0.75rem 1rem 1rem;
          margin: 0;
          border-top: 1px dashed #e5e7eb;
        }

        .invoice-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
          justify-content: center;
        }

        @media (max-width: 640px) {
          .invoice-header,
          .invoice-meta-grid,
          .invoice-parties,
          .invoice-footer {
            grid-template-columns: 1fr;
            display: block;
          }
          .invoice-meta-box:first-child,
          .invoice-party:first-child {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }
          .invoice-header-right {
            text-align: left;
            margin-top: 1rem;
          }
          .invoice-table {
            font-size: 11px;
          }
          .invoice-table .col-rate {
            display: none;
          }
          .invoice-table th.col-rate {
            display: none;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm 14mm;
          }

          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-page-wrap {
            max-width: none;
            padding: 0;
            margin: 0;
          }

          .invoice-sheet {
            border: none;
            box-shadow: none;
            page-break-inside: avoid;
          }

          .invoice-table thead {
            background: #111827 !important;
            color: #fff !important;
          }

          .invoice-total-row--grand {
            background: #111827 !important;
            color: #fff !important;
          }

          .invoice-actions {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

