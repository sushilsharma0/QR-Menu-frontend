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
import {
  clearCustomerIdentitySession,
  ensureGuestSession,
  getCustomerIdentity,
  getRestaurantInfo,
  getStoredCustomerId,
  getStoredCustomerProfile,
} from '../../services/customer';

const AccountPage = () => {
  const { slug, token } = useParams();
  const [showFeedback, setShowFeedback] = useState(false);
  const [guestId, setGuestId] = useState('');
  const [customerId, setCustomerId] = useState(getStoredCustomerId());
  const [customer, setCustomer] = useState(getStoredCustomerProfile());
  const [loyalty, setLoyalty] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
    if (!token) return;
    ensureGuestSession(token)
      .then((session) => {
        setGuestId(session.guestId || '');
        return getCustomerIdentity({ guestId: session.guestId, qrToken: token });
      })
      .then((identity) => {
        if (!identity) return;
        setCustomerId(identity.customerId || '');
        setCustomer(identity.customer || {});
        setLoyalty(identity.loyalty || null);
      })
      .catch(() => {});
  }, [slug, token]);

  useEffect(() => {
    if (!slug) return;
    getRestaurantInfo(slug, token)
      .then(setRestaurantInfo)
      .catch(() => setRestaurantInfo(null));
  }, [slug, token]);

  const homePath = slug && token ? `/home/${slug}/${token}` : '/';
  const ordersPath = slug && token ? `/orders/${slug}/${token}` : '/';
  const menuPath = slug && token ? `/menu/${slug}/${token}` : '/';
  const aboutPath = slug && token ? `/about/${slug}/${token}` : '/';
  const privacyPath = slug && token ? `/privacy/${slug}/${token}` : '/';
  const settingsPath = slug && token ? `/settings/${slug}/${token}` : '/';
  const creditApplyPath = slug && token ? `/credit-apply/${slug}/${token}` : '/';
  const restaurantName =
    restaurantInfo?.name || (slug ? decodeURIComponent(slug).replace(/-/g, ' ') : 'Restaurant');

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
      clearCustomerIdentitySession({ includeGuest: true });
      sessionStorage.removeItem('customer_portal_slug');
      sessionStorage.removeItem('customer_portal_table_token');
      setGuestId('');
      setCustomerId('');
      setCustomer({});
      setLoyalty(null);
      toast.success('Session cleared on this device');
    } catch {
      toast.error('Could not clear storage');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="relative min-h-[20rem] overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.72), rgba(57,16,0,0.7) 48%, rgba(250,250,247,1) 100%), url('${restaurantInfo?.backgroundPhoto || restaurantInfo?.brandBackgroundImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"}')`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%)]" />
        <div className="relative flex flex-col items-center px-6 pb-8 pt-12 text-center">
          <div className="rounded-2xl bg-black/38 px-5 py-2 shadow-lg backdrop-blur-[2px] ring-1 ring-white/15">
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">More</h1>
            <p className="mt-1 text-[11px] font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">Shortcuts & account</p>
          </div>

          <div className="mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white/95 text-primary-700 shadow-[0_18px_45px_rgba(57,16,0,0.28)] ring-4 ring-white/25">
            <User size={42} />
          </div>
          <h2 className="mt-3 max-w-full break-all rounded-full bg-black/45 px-5 py-1.5 text-center text-lg font-black text-white shadow-lg backdrop-blur-[2px] ring-1 ring-white/15 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {customer?.name || customerId || guestId || 'Guest'}
          </h2>
          <p className="mt-1 rounded-full bg-black/38 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-[2px] ring-1 ring-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            {customer?.email || (guestId ? 'Guest ID' : restaurantName)}
          </p>
          {customerId && (
            <p className="mt-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-primary-700 shadow-sm">
              {customerId} {loyalty ? `- ${loyalty.points || 0} pts` : ''}
            </p>
          )}
        </div>
      </section>

      <div className="-mt-6 space-y-2 px-6">
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

        {customerId && (
          <button
            type="button"
            className="mt-4 flex w-full items-center gap-4 p-4 text-red-500 opacity-90 hover:opacity-100"
            onClick={exitSession}
          >
            <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-900/20">
              <LogOut size={20} />
            </div>
            <span className="text-sm font-bold">End Session</span>
          </button>
        )}
      </div>

      <Feedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      <Navigation hidden={showFeedback} />
    </div>
  );
};

export default AccountPage;
