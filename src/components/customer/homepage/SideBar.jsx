import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, Settings, History, Globe, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-[1001] h-full w-[80%] max-w-xs bg-white p-6 shadow-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800">Explore</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
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

            <div className="absolute bottom-10 left-6">
              <Link to={homePath} onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-primary-600">
                ← Back to table home
              </Link>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                Version 1.0.4
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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
