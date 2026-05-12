import React, { useEffect, useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import {
  User, Bell, Lock, Globe, Moon, HelpCircle, Info, ChevronRight,
  Smartphone, Mail, LogOut, X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navigation from '../../../components/customer/Navigation'
import { rememberCustomerPortal } from '../../../utils/customerPortalContext'
import {
  changeCustomerIdentityPassword,
  ensureGuestSession,
  getCustomerIdentity,
  getStoredCustomerId,
  getStoredCustomerProfile,
  updateCustomerIdentityProfile,
} from '../../../services/customer'

const prefKey = 'customer_settings_v1'
const readPrefs = () => {
  try {
    return { pushNotifications: true, twoFactor: false, language: 'English', ...(JSON.parse(localStorage.getItem(prefKey) || '{}') || {}) }
  } catch {
    return { pushNotifications: true, twoFactor: false, language: 'English' }
  }
}

export default function Settings() {
  const { slug, token } = useParams()
  const homePath = slug && token ? `/home/${slug}/${token}` : '/'
  const { isDark, toggleTheme } = useTheme()
  const [guestId, setGuestId] = useState('')
  const [customerId, setCustomerId] = useState(getStoredCustomerId())
  const [customer, setCustomer] = useState(getStoredCustomerProfile())
  const [prefs, setPrefs] = useState(readPrefs)
  const [panel, setPanel] = useState(null)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token)
    if (!token) return
    ensureGuestSession(token)
      .then(async (session) => {
        setGuestId(session.guestId || '')
        const identity = await getCustomerIdentity({ guestId: session.guestId, qrToken: token })
        if (identity?.customerId) {
          setCustomerId(identity.customerId)
          setCustomer(identity.customer || {})
          setProfileForm({
            name: identity.customer?.name || '',
            phone: identity.customer?.phone || '',
            email: identity.customer?.email || '',
          })
        }
      })
      .catch(() => {})
  }, [slug, token])

  useEffect(() => {
    localStorage.setItem(prefKey, JSON.stringify(prefs))
  }, [prefs])

  const setPref = (key, value) => setPrefs((current) => ({ ...current, [key]: value }))

  const saveProfile = async () => {
    if (!customerId) return toast.error('Login or sign up first.')
    try {
      const data = await updateCustomerIdentityProfile({ qrToken: token, guestId, customerId, ...profileForm })
      setCustomer(data.customer || {})
      toast.success('Profile updated')
      setPanel(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update profile')
    }
  }

  const savePassword = async () => {
    if (!customerId) return toast.error('Login or sign up first.')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match')
    try {
      await changeCustomerIdentityPassword({ qrToken: token, guestId, customerId, currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated')
      setPanel(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update password')
    }
  }

  const logout = () => {
    localStorage.removeItem('customer_guest_id_v1')
    localStorage.removeItem('customer_identity_id_v1')
    localStorage.removeItem('customer_identity_profile_v1')
    toast.success('Session ended on this device')
    setGuestId('')
    setCustomerId('')
    setCustomer({})
    setProfileForm({ name: '', phone: '', email: '' })
  }

  const rows = [
    { section: 'Account', icon: User, label: 'Profile', description: customer?.name ? `${customer.name} - ${customer.email || customer.phone || 'Customer ID'}` : 'Name, email, phone', action: () => setPanel('profile') },
    { section: 'Account', icon: Smartphone, label: 'Linked Devices', description: 'This device is linked to your guest session', action: () => setPanel('devices') },
    { section: 'Account', icon: Mail, label: 'Notifications', description: prefs.pushNotifications ? 'Email and push enabled' : 'Notifications paused', action: () => setPanel('notifications') },
    { section: 'Preferences', icon: Moon, label: 'Dark Mode', description: 'Toggle dark theme', toggle: true, active: isDark, action: toggleTheme },
    { section: 'Preferences', icon: Globe, label: 'Language', description: prefs.language, trailing: prefs.language, action: () => setPanel('language') },
    { section: 'Preferences', icon: Bell, label: 'Push Notifications', description: 'Manage alerts', toggle: true, active: prefs.pushNotifications, action: () => setPref('pushNotifications', !prefs.pushNotifications) },
    { section: 'Security', icon: Lock, label: 'Change Password', description: 'Update your password', action: () => setPanel('password') },
    { section: 'Security', icon: Lock, label: 'Two-Factor Auth', description: 'Extra security layer', toggle: true, active: prefs.twoFactor, action: () => setPref('twoFactor', !prefs.twoFactor) },
    { section: 'Support', icon: HelpCircle, label: 'Help Center', description: 'FAQs and support', action: () => setPanel('help') },
    { section: 'Support', icon: Info, label: 'About', description: 'App version 1.0.4', action: () => setPanel('about') },
  ]
  const sections = [...new Set(rows.map((row) => row.section))]

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-center text-white">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm opacity-90">Customize your experience</p>
        <Link to={homePath} className="absolute left-4 top-4 z-10 rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-white/30">
          <X size={20} />
        </Link>
      </div>

      <div className="space-y-6 p-4">
        {sections.map((section) => (
          <div key={section}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{section}</h2>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {rows.filter((row) => row.section === section).map((item, idx, list) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`flex w-full items-center justify-between p-4 text-left ${idx < list.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 dark:bg-orange-900/30">
                      <item.icon size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  {item.toggle ? <Toggle on={item.active} /> : item.trailing ? <span className="text-xs text-gray-400">{item.trailing}</span> : <ChevronRight size={18} className="text-gray-300" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {customerId && (
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 p-4 text-red-500 dark:bg-red-900/20 dark:text-red-400">
            <LogOut size={18} />
            <span className="font-bold">End Session</span>
          </button>
        )}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">Version 1.0.4</p>
      </div>

      {panel && <SettingsPanel panel={panel} setPanel={setPanel} customerId={customerId} customer={customer} profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile} passwordForm={passwordForm} setPasswordForm={setPasswordForm} savePassword={savePassword} prefs={prefs} setPref={setPref} />}
      <Navigation />
    </div>
  )
}

function Toggle({ on }) {
  return <span className={`flex h-6 w-12 items-center rounded-full transition-colors ${on ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} /></span>
}

function SettingsPanel({ panel, setPanel, customerId, customer, profileForm, setProfileForm, saveProfile, passwordForm, setPasswordForm, savePassword, prefs, setPref }) {
  const close = () => setPanel(null)
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 px-4 pb-6 pt-12">
      <div className="max-h-[82vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black capitalize text-gray-950 dark:text-gray-100">{panel === 'password' ? 'Change password' : panel}</h3>
          <button onClick={close} className="rounded-xl bg-gray-100 p-2 dark:bg-gray-800"><X size={18} /></button>
        </div>
        {panel === 'profile' && (
          <div className="space-y-3">
            {!customerId && <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">Login or sign up to save profile details.</p>}
            {['name', 'phone', 'email'].map((field) => (
              <input key={field} value={profileForm[field]} onChange={(e) => setProfileForm((s) => ({ ...s, [field]: e.target.value }))} placeholder={field} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-950" />
            ))}
            <button onClick={saveProfile} className="w-full rounded-2xl bg-primary-600 py-3 text-sm font-black text-white">Save profile</button>
          </div>
        )}
        {panel === 'password' && (
          <div className="space-y-3">
            {!customerId && <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">Login first to change password.</p>}
            {[
              ['currentPassword', 'Current password'],
              ['newPassword', 'New password'],
              ['confirmPassword', 'Confirm new password'],
            ].map(([field, label]) => (
              <input key={field} value={passwordForm[field]} onChange={(e) => setPasswordForm((s) => ({ ...s, [field]: e.target.value }))} type="password" placeholder={label} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-950" />
            ))}
            <button onClick={savePassword} className="w-full rounded-2xl bg-primary-600 py-3 text-sm font-black text-white">Update password</button>
          </div>
        )}
        {panel === 'devices' && <InfoBlock title="Linked device" lines={[customerId ? `Customer ID: ${customerId}` : 'Guest mode on this device', customerId ? 'Use End Session in Settings to unlink this device.' : 'Login or create a customer ID to manage a saved session.']} />}
        {panel === 'notifications' && <ChoiceList choices={[['pushNotifications', 'Push notifications'], ['emailNotifications', `Email updates${customer?.email ? ` to ${customer.email}` : ''}`]]} prefs={prefs} setPref={setPref} />}
        {panel === 'language' && <ChoiceList choices={[['language', 'English'], ['language', 'Nepali']]} prefs={prefs} setPref={(_, value) => setPref('language', value)} radio />}
        {panel === 'help' && <InfoBlock title="Help Center" lines={['Use Menu to add items, Orders to track status, and More for account tools.', 'Ask staff from the home page using Call / assist.']} />}
        {panel === 'about' && <InfoBlock title="QR Restro Nepal" lines={['Customer ordering app version 1.0.4', 'Built for table ordering, live tracking, rewards, and bills.']} />}
      </div>
    </div>
  )
}

function InfoBlock({ title, lines }) {
  return <div className="space-y-3"><p className="font-bold text-gray-900 dark:text-gray-100">{title}</p>{lines.map((line) => <p key={line} className="rounded-2xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-950 dark:text-gray-300">{line}</p>)}</div>
}

function ChoiceList({ choices, prefs, setPref, radio = false }) {
  return <div className="space-y-2">{choices.map(([key, label]) => {
    const active = radio ? prefs.language === label : Boolean(prefs[key])
    return <button key={`${key}-${label}`} onClick={() => setPref(key, radio ? label : !prefs[key])} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-sm font-bold ${active ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}><span>{label}</span><Toggle on={active} /></button>
  })}</div>
}
