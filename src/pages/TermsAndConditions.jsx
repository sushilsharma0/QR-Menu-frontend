import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Mail, ShieldCheck } from 'lucide-react'
import BrandLogo from '../components/landing/BrandLogo'
import { LandingBrandingProvider } from '../context/LandingBrandingContext'
import { useLandingContent } from '../hooks/landing/useLandingContent'

const sections = [
  {
    title: '1. Acceptance of Terms',
    body:
      'By accessing the website, registering a vendor account, using the QR menu, ordering, billing, dashboard, staff, kitchen, cashier, reporting, subscription, or support features, you agree to these Terms and Conditions. If you do not agree, please do not use the platform.',
  },
  {
    title: '2. Platform Services',
    body:
      'The platform provides restaurant management tools including QR menu ordering, menu management, table ordering, order tracking, kitchen workflow, cashier billing, staff roles, customer feedback, reports, subscriptions, support tickets, and related services. Features may vary based on your plan, trial access, KYC status, branch settings, and permissions enabled by the platform administrator.',
  },
  {
    title: '3. Vendor Registration and Account Security',
    body:
      'Restaurant owners, authorized managers, and approved staff must provide accurate registration and business information. You are responsible for protecting account passwords, staff access, branch access, device sessions, and all activity under your account. You must notify us immediately if you suspect unauthorized access.',
  },
  {
    title: '4. Restaurant, Menu, and Customer Content',
    body:
      'You are responsible for all restaurant details, menus, prices, item descriptions, images, offers, taxes, customer notices, privacy content, and other information added to the platform. Content must be accurate, lawful, and must not mislead customers. We may remove or restrict content that appears abusive, illegal, fraudulent, unsafe, or harmful to the platform.',
  },
  {
    title: '5. Orders, Payments, Refunds, and Billing',
    body:
      'Restaurants are responsible for preparing orders, handling customer service, confirming bills, resolving order disputes, and managing refunds unless a separate written agreement says otherwise. Payment gateway availability, transaction success, settlement timing, and gateway charges may depend on third-party providers such as banks, wallets, or payment processors.',
  },
  {
    title: '6. Subscriptions, Trials, and Plan Access',
    body:
      'Free trials, paid subscriptions, feature access, limits, renewal dates, invoices, manual payments, and payment gateway checkout are controlled by the applicable plan and platform settings. We may change plan features or pricing with notice where practical. Failure to pay, expired plans, failed verification, or policy violations may limit access to paid or protected features.',
  },
  {
    title: '7. Customer Data and Privacy',
    body:
      'You must collect and use customer data only for lawful restaurant operations such as ordering, billing, loyalty, support, and communication. You are responsible for any privacy notice you publish for your restaurant. The platform may process account, order, device, security, payment, and usage data to provide services, prevent fraud, improve reliability, and meet legal or operational requirements.',
  },
  {
    title: '8. Cookies and Local Storage',
    body:
      'The website may use cookies, browser storage, and similar technologies to keep sessions working, remember preferences, improve performance, support security, and understand usage. Some features may not work correctly if essential storage is disabled.',
  },
  {
    title: '9. Acceptable Use',
    body:
      'You must not misuse the platform, attempt unauthorized access, bypass security controls, upload malicious content, abuse payment systems, impersonate another person or business, scrape data without permission, interfere with service availability, or use the platform for unlawful, deceptive, or harmful activity.',
  },
  {
    title: '10. Third-Party Services',
    body:
      'The platform may integrate with payment gateways, messaging services, email providers, cloud storage, maps, analytics, or other third-party services. These services are controlled by their own providers and may have separate terms, fees, limits, downtime, or data practices.',
  },
  {
    title: '11. Service Availability and Changes',
    body:
      'We aim to keep the platform reliable, but we do not guarantee uninterrupted or error-free service. Maintenance, updates, internet issues, device problems, third-party outages, or unexpected incidents may affect availability. We may improve, modify, suspend, or discontinue features when needed.',
  },
  {
    title: '12. Suspension or Termination',
    body:
      'We may suspend, restrict, or terminate access if you violate these Terms, provide false information, misuse the platform, fail to pay required charges, create security risks, or use the service in a way that may harm customers, restaurants, staff, third parties, or the platform.',
  },
  {
    title: '13. Intellectual Property',
    body:
      'The platform software, design, branding, workflows, code, documentation, and related materials belong to the platform owner or its licensors. You retain ownership of your restaurant content, but you grant us permission to host, display, process, and transmit that content as needed to provide the service.',
  },
  {
    title: '14. Disclaimers and Limitation of Liability',
    body:
      'The platform is provided on an as-is and as-available basis to the maximum extent permitted by law. We are not responsible for restaurant operations, food quality, customer disputes, incorrect menu information, third-party payment delays, lost profits, indirect damages, or business interruption except where required by applicable law.',
  },
  {
    title: '15. Updates to These Terms',
    body:
      'We may update these Terms from time to time. Updated Terms will be posted on this page with a new effective date. Continued use of the platform after updates means you accept the revised Terms.',
  },
]

const TermsAndConditions = () => {
  const { branding, chat, footer } = useLandingContent()
  const displayName = branding?.softwareName || 'QR Restro Nepal'
  const supportEmail = branding?.supportEmail || 'support@example.com'
  const contactPhone = branding?.contactPhone || chat?.displayPhone || chat?.whatsappNumber || ''

  return (
    <LandingBrandingProvider value={{ ...branding, chat, footer }}>
      <main className="min-h-screen bg-surface-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-surface-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo />
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <section className="py-10 sm:py-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700 shadow-sm">
              <FileText className="h-3.5 w-3.5" />
              Legal
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Terms and Conditions
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              These Terms explain how restaurants, vendors, staff, customers, and visitors may use {displayName}. They apply to the public website, vendor registration, dashboards, QR ordering, billing, subscriptions, and related platform services.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-xl border border-surface-200 bg-white px-3 py-2">
                Effective date: May 27, 2026
              </span>
              <span className="rounded-xl border border-surface-200 bg-white px-3 py-2">
                Applies to vendor and customer use
              </span>
            </div>
          </section>

          <section className="grid gap-4">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
              </article>
            ))}
          </section>

          <section className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/70 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-950">Questions About These Terms</h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Contact the platform team if you need help understanding these Terms, your account access, subscription, billing, or restaurant setup.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${supportEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-primary-700 shadow-sm transition hover:bg-primary-600 hover:text-white"
                  >
                    <Mail className="h-4 w-4" />
                    {supportEmail}
                  </a>
                  {contactPhone ? (
                    <a
                      href={`tel:+${String(contactPhone).replace(/\D/g, '')}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-primary-700 shadow-sm transition hover:bg-primary-600 hover:text-white"
                    >
                      {contactPhone}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </LandingBrandingProvider>
  )
}

export default TermsAndConditions
