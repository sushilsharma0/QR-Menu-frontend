import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, User, LogOut, CreditCard, Gift, BadgePlus } from 'lucide-react';

const UserProfile = ({
  isOpen,
  onClose,
  guestId,
  customerId,
  customer,
  tableNumber,
  rewardPoints,
  onRequestOtp,
  onCreateId,
  onEndSession,
  defaultOpenAuth = false,
  initialMode = 'signup',
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState('signup');
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', otp: '' });

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShowCreate(false);
      setOtpSent(false);
      setMode('signup');
      setForm({ name: '', phone: '', email: '', password: '', otp: '' });
    } else if (defaultOpenAuth) {
      setShowCreate(true);
      setMode(initialMode === 'login' ? 'login' : 'signup');
    }
  }, [defaultOpenAuth, initialMode, isOpen]);

  const requestOtp = async () => {
    try {
      await onRequestOtp?.({ email: form.email });
      setOtpSent(true);
    } catch {
      setOtpSent(false);
    }
  };

  const submitCreate = (event) => {
    event.preventDefault();
    onCreateId?.({ ...form, purpose: mode });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end overflow-y-auto p-4 pt-12 sm:p-6 sm:pt-20">
          <div className="fixed inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="relative z-[101] max-h-[calc(100vh-4rem)] w-full max-w-sm overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl sm:max-h-[calc(100vh-6rem)]"
          >
            <div className="relative bg-orange-500 p-6 text-center text-white">
              <button onClick={onClose} className="absolute right-4 top-4 text-white/70 hover:text-white">
                <X size={18} />
              </button>
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 shadow-inner">
                <User size={30} />
              </div>
              <h3 className="font-bold">{customerId || guestId || 'Guest'}</h3>
              {customer?.name && <p className="mt-1 text-sm font-bold text-white/90">{customer.name}</p>}
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-80">
                Table {tableNumber || '--'} - Active
              </p>
            </div>

            <div className="max-h-[calc(100vh-16rem)] space-y-1 overflow-y-auto p-4 sm:max-h-[calc(100vh-18rem)]">
              <ProfileButton icon={<CreditCard size={18} />} label="Saved Cards" />
              <ProfileButton icon={<Gift size={18} />} label={`My Rewards - ${rewardPoints ?? 0} pts`} />
              {customer?.email && <ProfileButton icon={<User size={18} />} label={customer.email} />}

              {!customerId && (
                <button
                  type="button"
                  onClick={() => setShowCreate((current) => !current)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-50"
                >
                  <div className="text-primary-500"><BadgePlus size={18} /></div>
                  Login / create customer ID
                </button>
              )}

              {showCreate && !customerId && (
                <form onSubmit={submitCreate} className="space-y-2 rounded-2xl bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {['signup', 'login'].map((nextMode) => (
                      <button
                        key={nextMode}
                        type="button"
                        onClick={() => {
                          setMode(nextMode);
                          setOtpSent(false);
                          setForm((current) => ({ ...current, otp: '' }));
                        }}
                        className={`rounded-xl py-2 text-xs font-black ${mode === nextMode ? 'bg-primary-600 text-white' : 'bg-white text-gray-500'}`}
                      >
                        {nextMode === 'signup' ? 'Sign up' : 'Login'}
                      </button>
                    ))}
                  </div>
                  {mode === 'signup' && (
                    <>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Full name"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                        required
                      />
                      <input
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Phone number"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                      />
                    </>
                  )}
                  <input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Gmail / email address"
                    type="email"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                    required
                  />
                  <input
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Password"
                    type="password"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                    required
                    minLength={6}
                  />
                  {mode === 'signup' && (
                    <>
                      <button
                        type="button"
                        onClick={requestOtp}
                        disabled={!form.email}
                        className="w-full rounded-xl border border-primary-200 bg-white py-2 text-sm font-black text-primary-700 disabled:opacity-50"
                      >
                        {otpSent ? 'Send OTP again' : 'Send email OTP'}
                      </button>
                      {otpSent && (
                        <input
                          value={form.otp}
                          onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          placeholder="6-digit OTP"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-black tracking-[0.35em] outline-none focus:border-primary-400"
                          required
                        />
                      )}
                    </>
                  )}
                  <p className="text-[10px] font-semibold text-gray-400">
                    {mode === 'signup'
                      ? 'Email OTP is required once. Your password will be used for future login.'
                      : 'Login with your email and password. Current guest history will merge into this ID.'}
                  </p>
                  <button
                    type="submit"
                    disabled={mode === 'signup' ? (!otpSent || form.otp.length !== 6 || form.password.length < 6) : form.password.length < 6}
                    className="w-full rounded-xl bg-primary-600 py-2 text-sm font-black text-white disabled:opacity-50"
                  >
                    {mode === 'signup' ? 'Verify and create ID' : 'Login'}
                  </button>
                </form>
              )}

              <div className="my-2 h-px bg-gray-50" />
              <button
                type="button"
                onClick={onEndSession}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
              >
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
  <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">
    <div className="text-gray-400">{icon}</div>
    {label}
  </button>
);

export default UserProfile;
