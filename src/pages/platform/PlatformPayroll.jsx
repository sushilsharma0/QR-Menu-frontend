import React, { useState } from 'react'
import { FiDollarSign } from 'react-icons/fi'
import PlatformPermissionGate from '../../components/platform/PlatformPermissionGate'
import { PlatformPageHeader } from '../../components/platform/PlatformUI'
import { usePlatformPayrollPage } from './payroll/usePlatformPayrollPage'
import PayrollControlsPanel from '../restaurant/finance/payroll/PayrollControlsPanel'
import PayrollMetricsStrip from '../restaurant/finance/payroll/PayrollMetricsStrip'
import PayrollInsightsPanel from '../restaurant/finance/payroll/PayrollInsightsPanel'
import PayrollRowsSection from '../restaurant/finance/payroll/PayrollRowsSection'
import PayrollEditModal from '../restaurant/finance/payroll/PayrollEditModal'
import PayrollSlipSection from '../restaurant/finance/payroll/PayrollSlipSection'
import PayrollHistorySection from '../restaurant/finance/payroll/PayrollHistorySection'
import PayrollDashboardTabs from '../restaurant/finance/payroll/PayrollDashboardTabs'

const PAGE_SUBTITLE =
  'Platform team payroll — admins you create under Admins appear here as employees (EMP001, …). Generate, edit, pay, and print slips like the restaurant payroll module.'

export default function PlatformPayroll() {
  const p = usePlatformPayrollPage()
  const [dashboardTab, setDashboardTab] = useState('run')

  return (
    <PlatformPermissionGate permission="managePayroll">
      <div className="space-y-6">
        <PlatformPageHeader
          badge="Internal HR"
          title="Platform payroll"
          description={PAGE_SUBTITLE}
          icon={FiDollarSign}
        />

        <PayrollDashboardTabs active={dashboardTab} onChange={setDashboardTab} />

        {dashboardTab === 'run' && (
          <>
            <PayrollControlsPanel
              user={p.user}
              statutory={p.statutory}
              setStatutory={p.setStatutory}
              statutorySaving={p.statutorySaving}
              saveStatutory={p.saveStatutory}
              showStatutorySettings
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
              enableStaffPicker
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

            <PayrollHistorySection history={p.history} onSlip={p.openSlip} />
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
    </PlatformPermissionGate>
  )
}
