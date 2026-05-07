import React, { useState } from 'react'
import { 
  User, Bell, Lock, Globe, Moon, 
  HelpCircle, Info, ChevronRight, 
  Smartphone, Mail, LogOut,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', description: 'Name, email, phone' },
      { icon: Smartphone, label: 'Linked Devices', description: 'Manage connected devices' },
      { icon: Mail, label: 'Notifications', description: 'Email preferences' },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { icon: Moon, label: 'Dark Mode', description: 'Toggle dark theme', toggle: true },
      { icon: Globe, label: 'Language', description: 'English', trailing: 'English' },
      { icon: Bell, label: 'Push Notifications', description: 'Manage alerts', toggle: true },
    ]
  },
  {
    title: 'Security',
    items: [
      { icon: Lock, label: 'Change Password', description: 'Update your password' },
      { icon: Lock, label: 'Two-Factor Auth', description: 'Extra security layer', toggle: true },
    ]
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center', description: 'FAQs and support' },
      { icon: Info, label: 'About', description: 'App version 1.0.4' },
    ]
  },
]

export default function Settings() {
  const [toggles, setToggles] = useState({
    darkMode: false,
    pushNotifications: true,
    twoFactor: false,
  })

  const toggleSetting = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-orange-500 p-6 text-white text-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm opacity-90 mt-1">Customize your experience</p>
        <Link
          to="/"
          className="absolute text-white top-4 z-10 left-4 bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          <X size={20} />
        </Link>
      </div>

      <div className="p-4 space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <div 
                  key={itemIndex}
                  className={`flex items-center justify-between p-4 ${
                    itemIndex < section.items.length - 1 
                      ? 'border-b border-gray-50 dark:border-gray-800' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <item.icon size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  
                  {item.toggle ? (
                    <button
                      onClick={() => toggleSetting(item.label.toLowerCase().replace(/[^a-z]/g, ''))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        toggles[item.label.toLowerCase().replace(/[^a-z]/g, '')]
                          ? 'bg-orange-500' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <div 
                        className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          toggles[item.label.toLowerCase().replace(/[^a-z]/g, '')]
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  ) : item.trailing ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.trailing}</span>
                  ) : (
                    <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button className="w-full bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-red-500 dark:text-red-400">
          <LogOut size={18} />
          <span className="font-bold">Log Out</span>
        </button>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Version 1.0.4 • Made with ❤️
        </p>
      </div>
    </div>
  )
}