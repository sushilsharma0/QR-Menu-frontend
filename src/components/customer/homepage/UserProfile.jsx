import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, User, LogOut, CreditCard, Gift } from 'lucide-react';

const UserProfile = ({ isOpen, onClose }) => {
  useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [isOpen])
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-start justify-end z-100 p-6 pt-20">
          {/* Click away overlay */}
          <div className="fixed inset-0" onClick={onClose}></div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="w-full max-w-70 bg-white rounded-4xl shadow-2xl border border-gray-100 overflow-hidden z-101"
          >
            {/* Header / Table ID */}
            <div className="bg-orange-500 p-6 text-white text-center relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                <X size={18} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-white/30 shadow-inner">
                <User size={30} />
              </div>
              <h3 className="font-bold">Guest #05</h3>
              <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mt-1">Table 05 • Active</p>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-1">
              <ProfileButton icon={<CreditCard size={18}/>} label="Saved Cards" />
              <ProfileButton icon={<Gift size={18}/>} label="My Rewards" />
              <div className="h-px bg-gray-50 my-2"></div>
              <button className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold">
                <LogOut size={18} />
                End Session
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ProfileButton = ({ icon, label }) => (
  <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-sm font-bold text-gray-700">
    <div className="text-gray-400">{icon}</div>
    {label}
  </button>
);

export default UserProfile;