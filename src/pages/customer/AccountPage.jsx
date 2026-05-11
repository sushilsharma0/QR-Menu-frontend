import React, { useEffect, useState } from 'react';
import { 
  User, 
  ShoppingBag, 
  Tag, 
  PhoneCall, 
  MessageSquare, 
  Info, 
  FileText, 
  ChevronRight,
  LogOut,
  Settings,
  Wallet,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Navigation from '../../components/customer/Navigation';
import Feedback from '../../components/customer/homepage/Feedback';
import { rememberCustomerPortal } from '../../utils/customerPortalContext';
import toast from 'react-hot-toast';
import { ensureGuestSession, getCustomerIdentity, getStoredCustomerId, getStoredCustomerProfile } from '../../services/customer';

const AccountPage = () => {
  const { slug, token } = useParams();
  const [showFeedback, setShowFeedback] = useState(false);
  const [customerId, setCustomerId] = useState(getStoredCustomerId());
  const [customer, setCustomer] = useState(getStoredCustomerProfile());
  const [loyalty, setLoyalty] = useState(null);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
    if (!token) return;
    ensureGuestSession(token)
      .then((session) => getCustomerIdentity({ guestId: session.guestId, qrToken: token }))
      .then((identity) => {
        if (!identity) return;
        setCustomerId(identity.customerId || '');
        setCustomer(identity.customer || {});
        setLoyalty(identity.loyalty || null);
      })
      .catch(() => {});
  }, [slug, token]);

  const homePath = slug && token ? `/home/${slug}/${token}` : '/';
  const ordersPath = slug && token ? `/orders/${slug}/${token}` : '/';
  const menuPath = slug && token ? `/menu/${slug}/${token}` : '/';
  const aboutPath = slug && token ? `/about/${slug}/${token}` : '/';
  const privacyPath = slug && token ? `/privacy/${slug}/${token}` : '/';
  const settingsPath = slug && token ? `/settings/${slug}/${token}` : '/';
  const creditApplyPath = slug && token ? `/credit-apply/${slug}/${token}` : '/';

  const menuItems = [
    { to: homePath, icon: User, label: 'Table home', color: 'text-primary-600', bg: 'bg-primary-50' },
    { to: ordersPath, icon: ShoppingBag, label: 'My orders', color: 'text-primary-700', bg: 'bg-primary-50' },
    { to: menuPath, icon: Tag, label: 'Browse menu', color: 'text-secondary-600', bg: 'bg-secondary-50' },
    { to: creditApplyPath, icon: Wallet, label: 'Apply for house credit', color: 'text-primary-700', bg: 'bg-primary-50' },
    { to: homePath, icon: PhoneCall, label: 'Call / assist', color: 'text-emerald-600', bg: 'bg-emerald-50', hint: 'Open home, then tap Call / assist' },
    { onClick: () => setShowFeedback(true), icon: MessageSquare, label: 'Feedback', color: 'text-primary-600', bg: 'bg-primary-50' },
    { to: aboutPath, icon: Info, label: 'About', color: 'text-accent-700', bg: 'bg-accent-50' },
    { to: settingsPath, icon: Settings, label: 'Settings', color: 'text-primary-600', bg: 'bg-primary-50' },
    { to: privacyPath, icon: FileText, label: 'Privacy', color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  const exitSession = () => {
    try {
      localStorage.removeItem('customer_guest_id_v1');
      localStorage.removeItem('customer_identity_id_v1');
      localStorage.removeItem('customer_identity_profile_v1');
      sessionStorage.removeItem('customer_portal_slug');
      sessionStorage.removeItem('customer_portal_table_token');
      toast.success('Session cleared on this device');
    } catch {
      toast.error('Could not clear storage');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 pb-6 pt-12 text-center backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <h1 className="text-xl font-black tracking-tight text-gray-800 dark:text-gray-100">More</h1>
        <p className="mt-1 text-[11px] font-semibold text-gray-400">Shortcuts & account</p>
      </header>

      <div className="flex flex-col items-center px-6 py-8">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-primary-50 text-primary-600 shadow-sm dark:border-gray-800">
          <User size={40} />
        </div>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{customer?.name || customerId || 'Guest'}</h2>
        <p className="mt-1 text-[10px] font-medium text-gray-400">
          {customer?.email || (slug ? decodeURIComponent(slug).replace(/-/g, ' ') : 'Restaurant')}
        </p>
        {customerId && (
          <p className="mt-2 rounded-full bg-primary-50 px-3 py-1 text-[10px] font-black text-primary-700">
            {customerId} {loyalty ? `- ${loyalty.points || 0} pts` : ''}
          </p>
        )}
      </div>

      <div className="space-y-2 px-6">
        {menuItems.map((item, index) => {
          const Inner = (
            <>
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-2.5 ${item.bg} ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                  {item.hint && (
                    <p className="text-[10px] text-gray-400">{item.hint}</p>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 transition-colors group-hover:text-primary-500 dark:text-gray-600 dark:group-hover:text-gray-300" />
            </>
          );
          const className =
            'group flex w-full items-center justify-between rounded-2xl border border-transparent bg-white p-4 transition-all hover:border-primary-100 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700';

          if (item.to) {
            return (
              <Link key={index} to={item.to} className={className}>
                {Inner}
              </Link>
            );
          }
          return (
            <button key={index} type="button" className={className} onClick={item.onClick}>
              {Inner}
            </button>
          );
        })}

        <button
          type="button"
          className="mt-4 flex w-full items-center gap-4 p-4 text-red-500 opacity-90 hover:opacity-100"
          onClick={exitSession}
        >
          <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-900/20">
            <LogOut size={20} />
          </div>
          <span className="text-sm font-bold">Clear guest session</span>
        </button>
      </div>

      <Feedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      <Navigation />
    </div>
  );
};

export default AccountPage;
