import {
  BarChart3,
  BellRing,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  TabletSmartphone,
  Users,
} from 'lucide-react'

export const siteName = 'QR Restro Nepal'

export const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Best', href: '#best' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Blog', href: '#blog' },
]

export const fallbackHero = {
  eyebrow: 'Digital dining platform for Nepal',
  title: 'Turn every table into a smart ordering point.',
  description:
    'QR Restro Nepal helps restaurants publish mobile menus, accept QR table orders, sync kitchen and cashier teams, and update website content from one admin panel.',
  image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1400',
}

export const fallbackFeatures = [
  {
    icon: Store,
    title: 'Vendor portal',
    text: 'Restaurant profile, KYC, subscription, billing, support tickets, and settings in one workflow.',
  },
  {
    icon: ClipboardList,
    title: 'Menu builder',
    text: 'Categories, items, photos, pricing, availability, taxes, and promotions managed by the restaurant team.',
  },
  {
    icon: QrCode,
    title: 'QR table ordering',
    text: 'Create tables, print QR codes, and let guests order directly from their seats.',
  },
  {
    icon: Users,
    title: 'Staff roles',
    text: 'Kitchen, cashier, waiter, manager, vendor, and platform admin access stay cleanly separated.',
  },
  {
    icon: BellRing,
    title: 'Live order flow',
    text: 'Real-time order updates keep kitchen, cashier, and service teams moving together.',
  },
  {
    icon: BarChart3,
    title: 'Reports and billing',
    text: 'Track order activity, subscriptions, invoices, restaurants, and platform operations.',
  },
]

export const fallbackBestThings = [
  { icon: Sparkles, value: 'Scan to order', label: 'Guests open the menu instantly from table QR codes and place orders without waiting.' },
  { icon: TabletSmartphone, value: 'Phone perfect', label: 'The public menu is designed for quick browsing, item details, cart flow, and order tracking.' },
  { icon: ShieldCheck, value: 'Team control', label: 'Separate vendor, waiter, kitchen, cashier, and platform access keeps work organized.' },
  { icon: CreditCard, value: 'SaaS billing', label: 'Plans, invoices, subscription requests, KYC, and CMS content are handled from platform admin.' },
]

export const fallbackAbout = {
  title: 'Built for restaurants that want faster service and cleaner operations.',
  description:
    'From a small cafe to a busy multi-table restaurant, QR Restro Nepal connects guests, staff, managers, and platform admins through one practical workflow.',
  image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200',
}

export const fallbackBlogs = [
  {
    key: 'cms-powered-website',
    title: 'How to manage a restaurant website from the admin CMS',
    metaDescription: 'Learn how banner, feature, about, and blog CMS entries keep the public website fresh without code changes.',
    content: 'A CMS-driven restaurant website lets your platform team update the landing page, publish new announcements, and improve SEO content without waiting for a developer. Start with a strong banner, add feature entries for the product benefits, create an about page entry for brand trust, and publish blog posts for guides and restaurant updates.',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=900',
    updatedAt: new Date().toISOString(),
  },
  {
    key: 'qr-ordering-nepal',
    title: 'Why QR ordering improves restaurant service in Nepal',
    metaDescription: 'See how table QR codes reduce waiting time and keep kitchen, waiter, and cashier teams aligned.',
    content: 'QR ordering gives guests a faster way to browse the menu and submit table orders. The biggest value is operational clarity: every order reaches the restaurant dashboard quickly, staff can track status, and customers see progress without repeated questions.',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=900',
    updatedAt: new Date().toISOString(),
  },
  {
    key: 'restaurant-saas-workflow',
    title: 'The complete SaaS workflow for restaurant vendors',
    metaDescription: 'Understand how vendor registration, KYC, subscriptions, staff roles, menus, and reporting work together.',
    content: 'A good restaurant SaaS system does more than show a menu. It manages vendor onboarding, subscriptions, staff roles, customer ordering, support tickets, reports, and content publishing from clear portals built for each role.',
    image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&q=80&w=900',
    updatedAt: new Date().toISOString(),
  },
]

export const featureIcons = [Store, ClipboardList, QrCode, Users, BellRing, BarChart3, ChefHat, LayoutDashboard]
