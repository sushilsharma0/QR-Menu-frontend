import React from 'react'
import { adPayrollMonthYearToBs, formatBsFromAd } from '../../../../utils/nepaliDateFormat'
import { monthName, numberToWords } from './payrollUtils'

function formatRs(n) {
  const v = Number(n || 0)
  return `Rs. ${v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`
}

/** 4-column row: label | value | label | value */
function RowPair({ leftLabel, leftVal, rightLabel, rightVal }) {
  return (
    <tr>
      <td className="border border-black px-2 py-1.5 font-semibold w-[22%]">{leftLabel}</td>
      <td className="border border-black px-2 py-1.5 w-[28%]">{leftVal}</td>
      <td className="border border-black px-2 py-1.5 font-semibold w-[22%]">{rightLabel}</td>
      <td className="border border-black px-2 py-1.5 text-right w-[28%]">{rightVal}</td>
    </tr>
  )
}

function EarningRow({ label, detail, amount, always = false }) {
  if (!always && Number(amount || 0) <= 0 && !detail) return null
  return (
    <tr>
      <td className="border border-black px-2 py-1" colSpan={3}>
        {label}
        {detail ? <span className="ml-1 text-[11px] font-normal text-gray-800">{detail}</span> : null}
      </td>
      <td className="border border-black px-2 py-1 text-right tabular-nums">{formatRs(amount)}</td>
    </tr>
  )
}

function DeductionRow({ label, amount }) {
  if (Number(amount || 0) <= 0) return null
  return (
    <tr>
      <td className="border border-black px-2 py-1" colSpan={3}>
        {label}
      </td>
      <td className="border border-black px-2 py-1 text-right tabular-nums">{formatRs(amount)}</td>
    </tr>
  )
}

export default function SalarySlip({ payroll, company }) {
  if (!payroll) return null
  const employee = payroll.employeeId || {}
  const netPay = Number(payroll.finalSalary || 0)
  const slipDate = payroll.paymentDate ? new Date(payroll.paymentDate) : null
  const bsPeriodLabel = adPayrollMonthYearToBs(payroll.periodMonth, payroll.periodYear)
  const bsPayDate = slipDate ? formatBsFromAd(slipDate) : ''

  const miscDeductions = Math.max(
    0,
    Number(payroll.deductions || 0) - Number(payroll.latePenalty || 0),
  )
  const totalDeductionsFromGross =
    Number(payroll.deductions || 0) +
    Number(payroll.advanceSalary || 0) +
    Number(payroll.tdsAmount ?? payroll.tax ?? 0) +
    Number(payroll.epfAmount || 0)

  const otPay = Number(payroll.overtimePay ?? payroll.overtime ?? 0)
  const otHours = Number(payroll.overtimeHours || 0)
  const otRate = Number(payroll.overtimeRate || 0)
  const otDetail =
    otPay > 0 && (otHours > 0 || otRate > 0)
      ? `(${otHours}h × ${formatRs(otRate)}/hr)`
      : otPay > 0
        ? ''
        : null

  const bankMasked =
    employee.bankAccountNumber && String(employee.bankAccountNumber).length > 4
      ? `···${String(employee.bankAccountNumber).slice(-4)}`
      : employee.bankAccountNumber || ''

  const netWords = numberToWords(Math.round(netPay))

  return (
    <div className="salary-slip-print bg-white p-6 text-black shadow-sm print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .salary-slip-print, .salary-slip-print * { visibility: visible !important; }
          .salary-slip-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 10mm 12mm !important;
            border: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <div className="mx-auto max-w-[210mm] font-serif text-[14px] leading-snug">
        <header className="border-b-2 border-black pb-3 text-center">
          <h1 className="text-[17px] font-bold uppercase tracking-wide">{company?.name || 'Company'}</h1>
          <p className="mt-1 text-[13px]">{company?.address || '—'}</p>
          {company?.city ? <p className="text-[12px] text-gray-800">{company.city}</p> : null}
          <h2 className="mt-4 text-[15px] font-bold uppercase tracking-widest">Salary slip</h2>
          <p className="mt-2 text-[11px] font-semibold uppercase text-gray-800">
            {payroll.paymentStatus === 'paid' ? (
              <span>Paid</span>
            ) : (
              <span className="text-amber-900">Pending payment</span>
            )}
            {slipDate ? (
              <span className="ml-2 font-normal normal-case text-gray-700">
                · Paid on {slipDate.toLocaleDateString('en-GB')}
                {bsPayDate ? ` (${bsPayDate} BS)` : ''}
              </span>
            ) : null}
          </p>
        </header>

        <table className="mt-4 w-full border-collapse border-2 border-black text-[13px]">
          <tbody>
            <RowPair
              leftLabel="Pay period"
              leftVal={(
                <span>
                  <span className="font-semibold">{monthName(payroll.periodMonth)} {payroll.periodYear}</span>
                  {bsPeriodLabel ? (
                    <span className="mt-0.5 block text-[11px] font-normal normal-case text-gray-800">
                      {bsPeriodLabel} (BS)
                    </span>
                  ) : null}
                </span>
              )}
              rightLabel="Slip date"
              rightVal={slipDate ? slipDate.toLocaleDateString('en-GB') : '—'}
            />
            <RowPair
              leftLabel="Employee"
              leftVal={<span className="uppercase">{employee.name || '—'}</span>}
              rightLabel="Days present / working"
              rightVal={`${payroll.presentDays ?? 0} / ${payroll.workingDays ?? '—'}`}
            />
            <RowPair
              leftLabel="Designation"
              leftVal={<span className="uppercase">{employee.designation || employee.role || '—'}</span>}
              rightLabel="Absent days"
              rightVal={String(payroll.absentDays ?? 0)}
            />
            <RowPair
              leftLabel="Department"
              leftVal={<span className="uppercase">{employee.department || employee.role || '—'}</span>}
              rightLabel="Late days"
              rightVal={String(payroll.lateDays ?? 0)}
            />
            <RowPair
              leftLabel="PAN"
              leftVal={employee.panNumber || '—'}
              rightLabel="Location"
              rightVal={company?.city || '—'}
            />
            <RowPair
              leftLabel="Bank"
              leftVal={employee.bankName || '—'}
              rightLabel="Account"
              rightVal={bankMasked || '—'}
            />
          </tbody>
        </table>

        <p className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wide">Earnings</p>
        <table className="w-full border-collapse border-2 border-black text-[13px]">
          <tbody>
            <EarningRow label="Contract basic (full month)" amount={payroll.basicSalary} always />
            <EarningRow label="Pro-rated basic (attendance)" amount={payroll.attendancePay} always />
            <EarningRow label="Allowance" amount={payroll.allowance} always />
            <EarningRow label="Overtime" detail={otDetail} amount={otPay} />
            <EarningRow label="Festival bonus" amount={payroll.festivalBonus} />
            <EarningRow label="Performance bonus" amount={payroll.performanceBonus} />
            <EarningRow label="Other bonus" amount={payroll.bonus} />
            <EarningRow label="Incentive" amount={payroll.incentive} />
            <tr className="break-inside-avoid">
              <td className="border border-black px-2 py-2 font-bold" colSpan={3}>
                Gross earnings
              </td>
              <td className="border border-black px-2 py-2 text-right font-bold tabular-nums">
                {formatRs(payroll.grossEarnings)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wide">Deductions</p>
        <table className="w-full border-collapse border-2 border-black text-[13px]">
          <tbody>
            <DeductionRow label="Other deductions" amount={miscDeductions} />
            <DeductionRow label="Late penalty" amount={payroll.latePenalty} />
            <DeductionRow label="Salary advance" amount={payroll.advanceSalary} />
            <DeductionRow label="TDS (tax withheld)" amount={payroll.tdsAmount ?? payroll.tax} />
            <DeductionRow label="Employee EPF" amount={payroll.epfAmount} />
            <tr className="break-inside-avoid">
              <td className="border border-black px-2 py-2 font-bold" colSpan={3}>
                Total deductions
              </td>
              <td className="border border-black px-2 py-2 text-right font-bold tabular-nums">
                {formatRs(totalDeductionsFromGross)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wide">Employer contribution (reference)</p>
        <table className="w-full border-collapse border-2 border-black text-[13px]">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1.5" colSpan={3}>
                Employer EPF <span className="text-[11px] font-normal">(not deducted from net pay)</span>
              </td>
              <td className="border border-black px-2 py-1.5 text-right tabular-nums">
                {formatRs(payroll.employerEpfAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mt-4 w-full border-collapse border-2 border-black text-[13px]">
          <tbody>
            <tr className="break-inside-avoid">
              <td className="border border-black px-2 py-2.5 font-bold uppercase" colSpan={3}>
                Net pay (take-home)
              </td>
              <td className="border border-black px-2 py-2.5 text-right text-base font-bold tabular-nums">
                {formatRs(netPay)}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-2 font-semibold" colSpan={1}>
                In words
              </td>
              <td className="border border-black px-2 py-2 text-center text-[12px] font-medium uppercase leading-tight" colSpan={3}>
                {netWords} only
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-[10px] leading-relaxed text-gray-800 print:text-[9px]">
          Net pay = gross earnings minus deductions above (including TDS and employee EPF). Employer EPF is shown for your records only.
        </p>

        <footer className="mt-10 flex justify-between text-[12px] print:mt-14">
          <div>
            <p className="font-semibold uppercase">Employee acknowledgement</p>
            <p className="mt-8 border-t border-black pt-1">Signature</p>
          </div>
          <div className="text-right">
            <p className="font-semibold uppercase">For {company?.name || 'Employer'}</p>
            <p className="mt-8 border-t border-black pt-1">Authorised signatory</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
