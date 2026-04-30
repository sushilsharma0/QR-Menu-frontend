import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, Settings, History, Globe, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-1000"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[80%] max-w-xs bg-white z-101 shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-gray-800">Explore</h2>
              <button
                onClick={onClose}
                className="p-2 bg-gray-50 rounded-lg text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Link to="/orderHistory">
                <SidebarItem icon={<History />} label="Order History" />
              </Link>
              <Link to="/about">
                <SidebarItem icon={<Info />} label="About Restaurant" />
              </Link>
              <SidebarItem
                icon={<Globe />}
                label="Language"
                trailing="English"
              />
              <Link to="/settings">
                <SidebarItem icon={<Settings />} label="Settings" />
              </Link>
              <Link to="/privacy">
                <SidebarItem icon={<ShieldCheck />} label="Privacy Policy" />
              </Link>
            </div>

            <div className="absolute bottom-10 left-6">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                Version 1.0.4
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SidebarItem = ({ icon, label, trailing }) => (
  <div className="flex items-center mb-0 justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
    <div className="flex items-center gap-4">
      <div className="text-gray-400 group-hover:text-orange-500 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </div>
    {trailing && (
      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
        {trailing}
      </span>
    )}
  </div>
);

export default Sidebar;
