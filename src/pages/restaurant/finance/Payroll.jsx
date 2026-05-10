import React, { useState } from 'react'

import { FinancePageHeader } from './FinanceUI'

import { usePayrollPage } from './payroll/usePayrollPage'

import PayrollControlsPanel from './payroll/PayrollControlsPanel'

import PayrollMetricsStrip from './payroll/PayrollMetricsStrip'

import PayrollInsightsPanel from './payroll/PayrollInsightsPanel'

import PayrollRowsSection from './payroll/PayrollRowsSection'

import PayrollEditModal from './payroll/PayrollEditModal'

import PayrollSlipSection from './payroll/PayrollSlipSection'

import PayrollHistorySection from './payroll/PayrollHistorySection'

import PayrollDashboardTabs from './payroll/PayrollDashboardTabs'



const PAGE_SUBTITLE =
  'Run tab: generate and pay salaries. Insights tab: Nepali date range start, filters, and per-employee detail (TDS, EPF, net) for any window.'



export default function FinancePayroll() {

  const p = usePayrollPage()

  const [dashboardTab, setDashboardTab] = useState('run')



  return (

    <div className="space-y-6">

      <FinancePageHeader title="Payroll" subtitle={PAGE_SUBTITLE} />



      <PayrollDashboardTabs active={dashboardTab} onChange={setDashboardTab} />



      {dashboardTab === 'run' && (

        <>

          <PayrollControlsPanel

            user={p.user}

            statutory={p.statutory}

            setStatutory={p.setStatutory}

            statutorySaving={p.statutorySaving}

            saveStatutory={p.saveStatutory}

            month={p.month}

            year={p.year}

            payrollPeriodBs={p.payrollPeriodBs}

            payrollPeriodAdIso={p.payrollPeriodAdIso}

            onPayrollPeriodDateChange={p.onPayrollPeriodDateChange}

            monthCount={p.monthCount}

            setMonthCount={p.setMonthCount}

            defaults={p.defaults}

            updateDefault={p.updateDefault}

            overtimePreview={p.overtimePreview}

            generating={p.generating}

            onGenerate={p.generate}

          />



          <PayrollMetricsStrip summary={p.data?.summary} />



          <PayrollRowsSection

            user={p.user}

            items={p.data?.items}

            staffDirectory={p.staffDirectory}

            staffPickId={p.staffPickId}

            setStaffPickId={p.setStaffPickId}

            onOpenPicker={p.openPayrollModalFromPicker}

            onEditRow={p.openPayrollModalForRow}

            onSlip={p.openSlip}

            onPrint={p.printSlip}

            onPay={p.pay}

            onDelete={p.removePayrollRow}

          />



          <PayrollEditModal

            payrollModal={p.payrollModal}

            setPayrollModal={p.setPayrollModal}

            modalProfile={p.modalProfile}

            modalLoading={p.modalLoading}

            modalForm={p.modalForm}

            setModalForm={p.setModalForm}

            month={p.month}

            year={p.year}

            payrollPeriodBs={p.payrollPeriodBs}

            savingModal={p.savingModal}

            onSave={p.saveModalPayroll}

          />



          <PayrollSlipSection

            slipRef={p.slipRef}

            selectedPayroll={p.selectedPayroll}

            company={p.company}

            onClose={() => p.setSelectedPayroll(null)}

          />



          <PayrollHistorySection

            history={p.history}

            onSlip={p.openSlip}

          />

        </>

      )}



      {dashboardTab === 'insights' && (

        <PayrollInsightsPanel

          insightsPeriodAdIso={p.insightsPeriodAdIso}

          insightsPayrollPeriodBs={p.insightsPayrollPeriodBs}

          onInsightsPayPeriodChange={p.onInsightsPayPeriodChange}

          statsYear={p.statsYear}

          summaryMonthFrom={p.summaryMonthFrom}

          setSummaryMonthFrom={p.setSummaryMonthFrom}

          summaryMonthTo={p.summaryMonthTo}

          setSummaryMonthTo={p.setSummaryMonthTo}

          summaryEmployeeId={p.summaryEmployeeId}

          setSummaryEmployeeId={p.setSummaryEmployeeId}

          summarySearch={p.summarySearch}

          setSummarySearch={p.setSummarySearch}

          staffDirectory={p.staffDirectory}

          employeeSummary={p.employeeSummary}

          summaryLoading={p.summaryLoading}

          onRefresh={p.loadEmployeeSummary}

        />

      )}

    </div>

  )

}

