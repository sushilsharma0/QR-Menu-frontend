import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { X, User, LogOut, CreditCard, Gift, BadgePlus, Loader2, Mail, ShieldCheck } from 'lucide-react';

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
  onRequestPasswordReset,
  onVerifyPasswordResetOtp,
  onResetPassword,
  onEndSession,
  defaultOpenAuth = false,
  initialMode = 'signup',
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState('signup');
  const [otpSent, setOtpSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetVerified, setResetVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetVerifying, setResetVerifying] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', otp: '', resetOtp: '', newPassword: '' });
  const isLoggedIn = Boolean(customerId);

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
      setResetSent(false);
      setResetVerified(false);
      setOtpSending(false);
      setResetSending(false);
      setResetVerifying(false);
      setResettingPassword(false);
      setSubmittingAuth(false);
      setMode('signup');
      setForm({ name: '', phone: '', email: '', password: '', otp: '', resetOtp: '', newPassword: '' });
    } else if (defaultOpenAuth) {
      setShowCreate(true);
      setMode(initialMode === 'login' ? 'login' : 'signup');
    }
  }, [defaultOpenAuth, initialMode, isOpen]);

  const requestOtp = async () => {
    try {
      setOtpSending(true);
      await onRequestOtp?.({ email: form.email });
      setOtpSent(true);
    } catch {
      setOtpSent(false);
    } finally {
      setOtpSending(false);
    }
  };

  const submitCreate = (event) => {
    event.preventDefault();
    (async () => {
      try {
        setSubmittingAuth(true);
        await onCreateId?.({ ...form, purpose: mode });
      } finally {
        setSubmittingAuth(false);
      }
    })();
  };

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end overflow-y-auto p-4 pt-12 sm:p-6 sm:pt-20">
          <button type="button" className="fixed inset-0" onClick={onClose} aria-label="Close profile" />

          <m.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="relative z-[101] max-h-[calc(100vh-4rem)] w-full max-w-sm overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-2xl sm:max-h-[calc(100vh-6rem)]"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-primary-700 px-6 pb-7 pt-6 text-center text-white">
              <div className="absolute -left-10 -top-16 h-36 w-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 right-4 h-44 w-44 rounded-full border border-white/15" />
              <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 text-white/75 transition hover:bg-white/15 hover:text-white">
                <X size={18} />
              </button>
              <div className="relative mx-auto mb-3 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-white/35 bg-white/20 shadow-[0_14px_35px_rgba(120,38,0,0.25)] backdrop-blur">
                <User size={30} />
              </div>
              <div className="relative">
                <p className="mx-auto mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {isLoggedIn ? 'Customer ID' : 'Guest session'}
                </p>
                <h3 className="text-lg font-semibold leading-tight">{customerId || guestId || 'Guest'}</h3>
                {customer?.name && <p className="mt-1 text-sm font-bold text-white/90">{customer.name}</p>}
              </div>
              <p className="relative mt-2 text-[10px] font-black uppercase tracking-widest opacity-85">
                Table {tableNumber || '--'} - Active
              </p>
            </div>

            <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto bg-gradient-to-b from-orange-50/45 to-white p-4 sm:max-h-[calc(100vh-18rem)]">
              <ProfileButton icon={<CreditCard size={18} />} label="Saved Cards" description="Payment methods" />
              <ProfileButton icon={<Gift size={18} />} label={`My Rewards - ${rewardPoints ?? 0} pts`} description="Available reward balance" accent />
              {customer?.email && <ProfileButton icon={<Mail size={18} />} label={customer.email} description="Verified account email" />}

              {!customerId && (
                <button
                  type="button"
                  onClick={() => setShowCreate((current) => !current)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-primary-100 bg-white p-3 text-sm font-black text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><BadgePlus size={18} /></div>
                  <span>Login / create customer ID</span>
                </button>
              )}

              {showCreate && !customerId && (
                <form onSubmit={submitCreate} className="space-y-3 rounded-[1.6rem] border border-orange-100 bg-white p-3 shadow-[0_18px_45px_rgba(154,52,18,0.08)]">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
                    {['signup', 'login'].map((nextMode) => (
                      <button
                        key={nextMode}
                        type="button"
                        onClick={() => {
                          setMode(nextMode);
                          setOtpSent(false);
                          setResetSent(false);
                          setResetVerified(false);
                          setForm((current) => ({ ...current, otp: '', resetOtp: '', newPassword: '' }));
                        }}
                        className={`rounded-xl py-2.5 text-xs font-black transition ${mode === nextMode ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}
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
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-400 focus:bg-white"
                        required
                      />
                      <input
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Phone number"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-400 focus:bg-white"
                      />
                    </>
                  )}
                  <input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Gmail / email address"
                    type="email"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-400 focus:bg-white"
                    required
                  />
                  <input
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Password"
                    type="password"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-400 focus:bg-white"
                    required
                    minLength={6}
                  />
                  {mode === 'signup' && (
                    <>
                      <button
                        type="button"
                        onClick={requestOtp}
                        disabled={!form.email || otpSending}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 py-3 text-sm font-black text-primary-700 transition hover:bg-primary-100 disabled:opacity-50"
                      >
                        {otpSending && <Loader2 size={16} className="animate-spin" />}
                        {otpSending ? 'Sending...' : otpSent ? 'Send OTP again' : 'Send email OTP'}
                      </button>
                      {otpSent && <OtpInput value={form.otp} onChange={(value) => setForm((current) => ({ ...current, otp: value }))} label="Enter email OTP" />}
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3 text-sm font-black text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submittingAuth && <Loader2 size={16} className="animate-spin" />}
                    {submittingAuth ? (mode === 'signup' ? 'Creating...' : 'Logging in...') : mode === 'signup' ? 'Verify and create ID' : 'Login'}
                  </button>
                  {mode === 'login' && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setResetSending(true);
                            await onRequestPasswordReset?.({ email: form.email });
                            setResetSent(true);
                            setResetVerified(false);
                          } catch {
                            setResetSent(false);
                          } finally {
                            setResetSending(false);
                          }
                        }}
                        disabled={!form.email || resetSending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-black text-primary-700 shadow-sm disabled:opacity-50"
                      >
                        {resetSending && <Loader2 size={14} className="animate-spin" />}
                        {resetSending ? 'Sending reset OTP...' : 'Forgot password?'}
                      </button>
                      {resetSent && (
                        <div className="mt-2 space-y-2">
                          <OtpInput value={form.resetOtp} onChange={(value) => setForm((current) => ({ ...current, resetOtp: value }))} label="Enter reset OTP" />
                          {!resetVerified ? (
                            <button
                              type="button"
                              disabled={form.resetOtp.length !== 6 || resetVerifying}
                              onClick={async () => {
                                try {
                                  setResetVerifying(true);
                                  await onVerifyPasswordResetOtp?.({ email: form.email, otp: form.resetOtp });
                                  setResetVerified(true);
                                } catch {
                                  setResetVerified(false);
                                } finally {
                                  setResetVerifying(false);
                                }
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 py-3 text-xs font-black text-white disabled:opacity-50"
                            >
                              {resetVerifying && <Loader2 size={14} className="animate-spin" />}
                              {resetVerifying ? 'Verifying...' : 'Verify OTP'}
                            </button>
                          ) : (
                            <>
                              <input
                                value={form.newPassword}
                                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                                placeholder="New password"
                                type="password"
                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
                              />
                              <button
                                type="button"
                                disabled={form.newPassword.length < 6 || resettingPassword}
                                onClick={async () => {
                                  try {
                                    setResettingPassword(true);
                                    await onResetPassword?.({ email: form.email, otp: form.resetOtp, newPassword: form.newPassword });
                                    setResetSent(false);
                                    setResetVerified(false);
                                    setMode('login');
                                    setForm((current) => ({ ...current, password: '', resetOtp: '', newPassword: '' }));
                                  } finally {
                                    setResettingPassword(false);
                                  }
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 py-3 text-xs font-black text-white disabled:opacity-50"
                              >
                                {resettingPassword && <Loader2 size={14} className="animate-spin" />}
                                {resettingPassword ? 'Resetting...' : 'Reset password'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </form>
              )}

              {customerId && (
                <>
                  <div className="my-2 h-px bg-gray-50" />
                  <button
                    type="button"
                    onClick={onEndSession}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-black text-red-500 transition hover:bg-red-100"
                  >
                    <LogOut size={18} />
                    End Session
                  </button>
                </>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
};

const OtpInput = ({ value, onChange, label }) => {
  const inputRef = useRef(null);
  const normalized = (value || '').replace(/\D/g, '').slice(0, 6);
  const digits = Array.from({ length: 6 }, (_, index) => normalized[index] || '');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">{label}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
          <ShieldCheck size={12} />
          Secure
        </span>
      </div>
      <div className="relative">
        <div className="grid grid-cols-6 gap-1.5">
          {digits.map((digit, index) => (
            <div
              key={`otp-${index}`}
              className={`flex aspect-square items-center justify-center rounded-2xl border text-lg font-black shadow-sm transition ${
                digit ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-300'
              }`}
            >
              {digit || '-'}
            </div>
          ))}
        </div>
        <input
          ref={inputRef}
          value={normalized}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          onPaste={(event) => {
            event.preventDefault();
            onChange(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6));
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
      </div>
    </div>
  );
};

const ProfileButton = ({ icon, label, description, accent = false }) => (
  <button className="flex w-full items-center gap-3 rounded-2xl border border-white bg-white p-3 text-left text-sm font-bold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-100 hover:shadow-md">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accent ? 'bg-orange-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
      {icon}
    </div>
    <span className="min-w-0">
      <span className="block truncate">{label}</span>
      {description && <span className="block truncate text-[11px] font-semibold text-gray-400">{description}</span>}
    </span>
  </button>
);

export default UserProfile;
