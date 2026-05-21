import React, { useEffect } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  X,
  Info,
  Settings,
  History,
  Globe,
  ShieldCheck,
  Phone,
  Tag,
  MessageSquare,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const Sidebar = ({
  isOpen,
  onClose,
  onCallAssist,
  onOffers,
  onFeedback,
  offersCount = 0,
}) => {
  const { slug, token } = useParams();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const hasPortal = Boolean(slug && token);
  const homePath = hasPortal ? `/home/${slug}/${token}` : "/";
  const ordersPath = hasPortal ? `/orders/${slug}/${token}` : "/";
  const aboutPath = hasPortal ? `/about/${slug}/${token}` : "/";
  const settingsPath = hasPortal ? `/settings/${slug}/${token}` : "/";
  const privacyPath = hasPortal ? `/privacy/${slug}/${token}` : "/";

  const handleQuickAction = (handler) => () => {
    onClose?.();
    // Run after the sidebar starts closing so the modal that opens next
    // doesn't fight the sidebar's exit animation for focus.
    setTimeout(() => {
      handler?.();
    }, 180);
  };

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
          />

          <m.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-[1001] flex h-full w-[80%] max-w-xs flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 pb-4 pt-6">
              <h2 className="text-xl font-semibold text-gray-800">Explore</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick actions moved here from the floating bar on the Home
                page so the home view stays focused on the menu. Each button
                closes the sidebar first, then triggers its action. */}
            {(onCallAssist || onOffers || onFeedback) && (
              <div className="px-6">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                  Quick actions
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <QuickActionTile
                    icon={<Phone size={16} />}
                    label="Assist"
                    onClick={handleQuickAction(onCallAssist)}
                    disabled={!onCallAssist}
                  />
                  <QuickActionTile
                    icon={<Tag size={16} />}
                    label="Offers"
                    badge={offersCount > 0 ? offersCount : null}
                    onClick={handleQuickAction(onOffers)}
                    disabled={!onOffers}
                  />
                  <QuickActionTile
                    icon={<MessageSquare size={16} />}
                    label="Feedback"
                    onClick={handleQuickAction(onFeedback)}
                    disabled={!onFeedback}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex-1 space-y-1 overflow-y-auto px-6 pb-6">
              <Link to={ordersPath} onClick={onClose}>
                <SidebarItem icon={<History size={20} />} label="My orders" disabled={!hasPortal} />
              </Link>
              <Link to={aboutPath} onClick={onClose}>
                <SidebarItem icon={<Info size={20} />} label="About restaurant" disabled={!hasPortal} />
              </Link>
              <div className="pointer-events-none opacity-60">
                <SidebarItem
                  icon={<Globe size={20} />}
                  label="Language"
                  trailing="English"
                />
              </div>
              <Link to={settingsPath} onClick={onClose}>
                <SidebarItem icon={<Settings size={20} />} label="Settings" disabled={!hasPortal} />
              </Link>
              <Link to={privacyPath} onClick={onClose}>
                <SidebarItem icon={<ShieldCheck size={20} />} label="Privacy policy" disabled={!hasPortal} />
              </Link>
            </div>

            <div className="border-t border-gray-100 px-6 pb-8 pt-4">
              <Link to={homePath} onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-primary-600">
                ← Back to table home
              </Link>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                Version 1.0.4
              </p>
            </div>
          </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

const QuickActionTile = ({ icon, label, badge, onClick, disabled }) => (
  <m.button
    type="button"
    whileTap={disabled ? undefined : { scale: 0.94 }}
    onClick={onClick}
    disabled={disabled}
    className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition-colors active:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {badge != null && (
      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
        {badge}
      </span>
    )}
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-500">
      {icon}
    </span>
    <span className="text-[10px] font-black text-gray-800">{label}</span>
  </m.button>
);

const SidebarItem = ({ icon, label, trailing, disabled }) => (
  <div
    className={`group mb-0 flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-colors ${
      disabled ? "cursor-not-allowed opacity-50" : "hover:bg-primary-50/80"
    }`}
  >
    <div className="flex items-center gap-4">
      <div className="text-gray-400 transition-colors group-hover:text-primary-600">{icon}</div>
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </div>
    {trailing && (
      <span className="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-700">
        {trailing}
      </span>
    )}
  </div>
);

export default Sidebar;
