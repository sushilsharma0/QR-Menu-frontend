import {
  BarChart3,
  BellRing,
  ChefHat,
  ClipboardList,
  CookingPot,
  CreditCard,
  LayoutDashboard,
  MessageSquareHeart,
  ReceiptIndianRupee,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  TabletSmartphone,
  Timer,
  Users,
} from 'lucide-react'

export const siteName = 'QR Restro Nepal'

export const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Best', href: '#best' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
]

export const fallbackHero = {
  eyebrow: 'Digital Dining Platform Built for Restaurants in Nepal',
  title: 'Turn every table into a smart ordering experience.',
  description:
    'Turn every table into a smart ordering experience with QR menus, live kitchen updates, cashier billing, and restaurant management - all from one modern platform.',
  image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1400',
  typewriterPhrases: ['QR scanning live', 'Kitchen synced', 'Cashier ready'],
}

export const fallbackOfferBanner = {
  eyebrow: 'Limited Launch Offer for Restaurants in Nepal',
  title: 'First 10 Restaurants Get 1 Month Free',
  description:
    'Start using QR Restro Nepal with zero platform cost for the first month. Early restaurants receive priority onboarding support and setup assistance.',
  image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
  ctaLabel: 'Claim Free Month',
}

export const fallbackFeatures = [
  {
    icon: QrCode,
    title: 'QR Menu for Every Table',
    text: 'Customers scan and order instantly using a modern digital menu experience.',
  },
  {
    icon: ClipboardList,
    title: 'Easy Menu Management',
    text: 'Update categories, pricing, availability, food photos, and offers anytime from your dashboard.',
  },
  {
    icon: CookingPot,
    title: 'Live Kitchen Workflow',
    text: 'Orders move clearly from Pending -> Preparing -> Ready -> Served with real-time updates.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'Fast Billing & Cashier',
    text: 'Manage payments, generate bills, and close tables quickly during peak hours.',
  },
  {
    icon: Timer,
    title: 'Wait-Time Visibility',
    text: 'Show estimated preparation time so customers know when their food will arrive.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Better Guest Experience',
    text: 'Cleaner ordering and faster service help improve repeat visits and customer satisfaction.',
  },
]

export const fallbackBestThings = [
  { icon: Sparkles, value: 'Faster Table Turnover', label: 'Guests order instantly from their phones so your staff can serve more tables during busy hours.' },
  { icon: TabletSmartphone, value: 'Mobile-First Ordering', label: 'Menus, cart, and live order tracking work smoothly on every smartphone without app installation.' },
  { icon: ShieldCheck, value: 'Organized Team Workflow', label: 'Kitchen, cashier, waiter, and manager each get clear actions with less confusion and faster communication.' },
  { icon: CreditCard, value: 'Better Revenue Visibility', label: 'Track orders, sales, and restaurant performance from one centralized dashboard.' },
]

export const fallbackAbout = {
  title: 'Built for Restaurants That Want Modern Operations',
  description:
    'QR Restro Nepal is designed for restaurants, cafes, hotels, and food businesses that want to simplify daily operations and improve guest experience.',
  image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200',
}

export const landingStats = [
  { label: 'Restaurants Onboarded', value: 100, suffix: '+' },
  { label: 'Orders Processed', value: 5000, suffix: '+' },
  { label: 'Active Guests This Month', value: 500, suffix: '' },
]

export const featuredRestaurants = [
  { name: 'Himalayan Bites', code: 'HB' },
  { name: 'Momo Hub', code: 'MH' },
  { name: 'Newari Ghar', code: 'NG' },
  { name: 'Kathmandu Kitchen', code: 'KK' },
  { name: 'Thakali House', code: 'TH' },
  { name: 'Spice Courtyard', code: 'SC' },
  { name: 'Sunrise Cafe', code: 'SF' },
  { name: 'Everest BBQ', code: 'EB' },
]

export const fallbackBlogs = [
  {
    key: 'what-is-qr-restro-nepal',
    title: 'What is QR Restro Nepal?',
    metaDescription: 'Learn how QR Restro Nepal helps restaurants digitize menus, manage live orders, and improve customer experience with one connected platform.',
    content: 'Learn how modern restaurants improve operations, reduce waiting time, and increase repeat customers using QR ordering systems.',
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

export const featureIcons = [QrCode, ClipboardList, CookingPot, ReceiptIndianRupee, Timer, MessageSquareHeart, ChefHat, BarChart3, BellRing, Store, LayoutDashboard, Users]
