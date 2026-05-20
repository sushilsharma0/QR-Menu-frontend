import React from 'react'
import { useSearchParams } from 'react-router-dom'
import PlatformSettingsHub from '../../components/platform/settings/PlatformSettingsHub'
import PlatformSettingsSectionShell from '../../components/platform/settings/PlatformSettingsSectionShell'
import PlatformProfileSection from '../../components/platform/settings/PlatformProfileSection'
import PlatformPasswordSection from '../../components/platform/settings/PlatformPasswordSection'
import PlatformAccountOverviewSection from '../../components/platform/settings/PlatformAccountOverviewSection'

const SECTION_IDS = new Set(['overview', 'profile', 'security'])

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const activeSection = SECTION_IDS.has(sectionParam) ? sectionParam : null

  const onSelectSection = (id) => {
    setSearchParams({ section: id })
  }

  const onBack = () => {
    setSearchParams({})
  }

  if (!activeSection) {
    return (
      <div className="mx-auto max-w-5xl">
        <PlatformSettingsHub onSelectSection={onSelectSection} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PlatformSettingsSectionShell sectionId={activeSection} onBack={onBack}>
        {activeSection === 'overview' && <PlatformAccountOverviewSection />}
        {activeSection === 'profile' && <PlatformProfileSection />}
        {activeSection === 'security' && <PlatformPasswordSection />}
      </PlatformSettingsSectionShell>
    </div>
  )
}

export default Settings
