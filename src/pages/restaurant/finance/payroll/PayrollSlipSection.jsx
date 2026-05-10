import React from 'react'
import { FiPrinter } from 'react-icons/fi'
import Button from '../../../../components/common/Button'
import { FinancePanel } from '../FinanceUI'
import SalarySlip from './SalarySlip'

export default function PayrollSlipSection({ slipRef, selectedPayroll, company, onClose }) {
  if (!selectedPayroll) return null

  return (
    <div ref={slipRef}>
      <FinancePanel
        title="Salary slip"
        actions={(
          <>
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            <Button type="button" onClick={() => window.print()}>
              <FiPrinter className="mr-1" /> Print / Download PDF
            </Button>
          </>
        )}
      >
        <SalarySlip payroll={selectedPayroll} company={company} />
      </FinancePanel>
    </div>
  )
}
