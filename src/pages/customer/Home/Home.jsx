import React, { useEffect, useRef, useState } from "react";
import {
  BadgePlus,
  BellRing,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LogIn,
  Menu,
  QrCode,
  User,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import SideBar from "../../../components/customer/homepage/SideBar";
import UserProfile from "../../../components/customer/homepage/UserProfile";
import Waiters from "../../../components/customer/homepage/Waiters";
import QRScannerModal from "../../../components/customer/homepage/QRScannerModal";
import Offers from "../../../components/customer/homepage/Offers";
import Feedback from "../../../components/customer/homepage/Feedback";
import PromoCodeModal from "../../../components/customer/homepage/PromoCodeModal";
import PageTransition from "../../../components/customer/PageTransition";
import api from "../../../services/api";
import {
  ensureGuestSession,
  claimCustomerIdentity,
  requestCustomerIdentityOtp,
  requestCustomerPasswordReset,
  resetCustomerPassword,
  verifyCustomerPasswordResetOtp,
  clearCustomerIdentitySession,
  getStoredCustomerId,
  getCustomerIdentity,
  getRestaurantInfo,
  getGuestLoyalty,
  postGuestTableRequest,
} from "../../../services/customer";
import toast from "@utils/toast";
import Navigation from "../../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showWaiters, setShowWaiters] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [promoBanners, setPromoBanners] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const promoModalShownRef = useRef(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [guestIdLocal, setGuestIdLocal] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerProfile, setCustomerProfile] = useState(null);
  const [showFirstScanChoice, setShowFirstScanChoice] = useState(false);
  const [profileInitialMode, setProfileInitialMode] = useState("signup");
  const [profileDefaultOpenAuth, setProfileDefaultOpenAuth] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [showGuestAssist, setShowGuestAssist] = useState(false);
  const [assistSending, setAssistSending] = useState(false);
  // Inline menu state â€” keeps the customer on the home page while letting
  // them peek at and then expand the full menu without a navigation.
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const { slug, token } = useParams();

  const restaurantDisplayName = slug
    ? decodeURIComponent(slug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Restaurant";

  useEffect(() => {
    if (!slug || !token) return;
    const storedCustomerId = getStoredCustomerId();
    setCustomerId(storedCustomerId);
    if (!storedCustomerId && !sessionStorage.getItem(`customer_entry_choice_${token}`)) {
      setShowFirstScanChoice(true);
    }
    ensureGuestSession(token)
      .then(async (session) => {
        setGuestIdLocal(session.guestId || "");
        try {
          const identity = await getCustomerIdentity({ guestId: session.guestId, qrToken: token });
          if (identity?.customerId) {
            setCustomerId(identity.customerId);
            setCustomerProfile(identity.customer);
            setLoyaltyPoints(identity.loyalty?.points ?? 0);
          } else {
            const bal = await getGuestLoyalty({ guestId: session.guestId, qrToken: token });
            setLoyaltyPoints(bal.points ?? 0);
          }
        } catch {
          setLoyaltyPoints(0);
        }
      })
      .catch((err) => {
        console.error("Failed to initialize guest session", err);
      });
    fetchTables();
    fetchPromoBanners();
    fetchRestaurantInfo();
  }, [slug, token]);

  const openAuthProfile = (mode) => {
    setProfileInitialMode(mode);
    setProfileDefaultOpenAuth(true);
    setIsProfileOpen(true);
    setShowFirstScanChoice(false);
  };

  const continueAsGuest = () => {
    clearCustomerIdentitySession();
    setCustomerId("");
    setCustomerProfile(null);
    sessionStorage.setItem(`customer_entry_choice_${token}`, "guest");
    setShowFirstScanChoice(false);
  };

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  const fetchRestaurantInfo = async () => {
    try {
      if (!slug) return;
      const info = await getRestaurantInfo(slug);
      setRestaurantInfo(info);
    } catch (error) {
      console.error("Failed to fetch restaurant info:", error);
    }
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/restaurant/tables/qr/${token}`);
      setTableNumber(res.data.data.tableNumber);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      toast.error("Failed to fetch table");
    } finally {
      setLoading(false);
    }
  };

  // Fetch the public menu so we can show a small preview on the home page
  // and let the customer expand it inline (with a smooth animation) instead
  // of jumping to a separate /menu route just to glance at categories.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setMenuLoading(true);
        const qs = token ? `?qrToken=${encodeURIComponent(token)}` : "";
        const res = await api.get(`/restaurant/menu/public/${slug}${qs}`);
        const data = res?.data?.data?.menu || [];
        if (!cancelled) setMenuCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load menu preview:", err);
        if (!cancelled) setMenuCategories([]);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  const toggleMenuExpanded = () => {
    setMenuExpanded((v) => {
      const next = !v;
      // When expanding, scroll the page so the menu starts near the top â€”
      // matches the "top section goes up and hides" intent of the UX.
      if (next) {
        requestAnimationFrame(() =>
          window.scrollTo({ top: 0, behavior: "smooth" }),
        );
      }
      return next;
    });
  };

  const fetchPromoBanners = async () => {
    try {
      if (!slug) return;
      const res = await api.get(`/customer/offers/${slug}`);
      const promos = res?.data?.data || [];
      setPromoBanners(promos);
      if (!promoModalShownRef.current && promos.length > 0) {
        setShowPromoModal(true);
        promoModalShownRef.current = true;
      }
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
      setPromoBanners([]);
    }
  };

  const handleScanSuccess = (data) => {
    toast.success(`QR scanned: ${data}`);
  };

  const sendGuestRequest = async (requestType) => {
    if (!guestIdLocal) {
      toast.error("Session not ready â€” try again.");
      return;
    }
    try {
      setAssistSending(true);
      await postGuestTableRequest({ qrToken: token, guestId: guestIdLocal, requestType });
      toast.success("Staff notified on their dashboards.");
      setShowGuestAssist(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send request");
    } finally {
      setAssistSending(false);
    }
  };

  const refreshLoyalty = async (guestId) => {
    try {
      const bal = await getGuestLoyalty({ guestId, qrToken: token });
      setLoyaltyPoints(bal.points ?? 0);
    } catch {
      setLoyaltyPoints(0);
    }
  };

  const handleRequestCustomerOtp = async ({ email }) => {
    if (!guestIdLocal) {
      toast.error("Session not ready yet.");
      return;
    }
    if (!String(email || "").trim()) {
      toast.error("Enter your Gmail or email address.");
      return;
    }
    try {
      await requestCustomerIdentityOtp({
        qrToken: token,
        guestId: guestIdLocal,
        email,
      });
      toast.success("OTP sent to your email.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send OTP");
      throw err;
    }
  };

  const handleCreateCustomerId = async ({ name, phone, email, otp, password, purpose }) => {
    if (!guestIdLocal) {
      toast.error("Session not ready yet.");
      return;
    }
    if (!String(email || "").trim() || !String(password || "").trim() || (purpose !== "login" && !String(otp || "").trim())) {
      toast.error(purpose === "login" ? "Enter email and password." : "Enter email, password and OTP.");
      return;
    }
    try {
      const data = await claimCustomerIdentity({
        qrToken: token,
        guestId: guestIdLocal,
        name,
        phone,
        email,
        otp,
        password,
        purpose,
      });
      setGuestIdLocal(data.guestId || guestIdLocal);
      setCustomerId(data.customerId || "");
      setCustomerProfile(data.customer || null);
      setLoyaltyPoints(data.loyalty?.points ?? 0);
      sessionStorage.setItem(`customer_entry_choice_${token}`, purpose === "login" ? "login" : "signup");
      setProfileDefaultOpenAuth(false);
      toast.success(`${data.customerId} ready. Previous orders and points merged.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not verify customer ID");
    }
  };

  const handleRequestPasswordReset = async ({ email }) => {
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) {
      toast.error("Enter your email first.");
      throw new Error("Email is required");
    }

    let activeGuestId = guestIdLocal;
    if (!activeGuestId) {
      try {
        const session = await ensureGuestSession(token);
        activeGuestId = session.guestId || "";
        setGuestIdLocal(activeGuestId);
      } catch {
        toast.error("Session not ready yet. Please try again.");
        throw new Error("Guest session is not ready");
      }
    }

    if (!activeGuestId) {
      toast.error("Session not ready yet. Please try again.");
      throw new Error("Guest session is not ready");
    }

    await requestCustomerPasswordReset({ qrToken: token, guestId: activeGuestId, email: cleanEmail });
    toast.success("Reset OTP sent to your email.");
  };

  const handleResetPassword = async ({ email, otp, newPassword }) => {
    if (!guestIdLocal) return;
    try {
      await resetCustomerPassword({ qrToken: token, guestId: guestIdLocal, email, otp, newPassword });
      toast.success("Password reset. You can login now.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not reset password");
      throw err;
    }
  };

  const handleVerifyPasswordResetOtp = async ({ email, otp }) => {
    if (!guestIdLocal) return;
    try {
      await verifyCustomerPasswordResetOtp({ qrToken: token, guestId: guestIdLocal, email, otp });
      toast.success("OTP verified. Enter your new password.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid reset OTP");
      throw err;
    }
  };

  const handleEndSession = () => {
    clearCustomerIdentitySession({ includeGuest: true });
    setGuestIdLocal("");
    setCustomerId("");
    setCustomerProfile(null);
    setLoyaltyPoints(0);
    toast.success("Session ended on this device.");
  };

  const restaurantHeroFallback =
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80";
  const heroImage =
    restaurantInfo?.backgroundPhoto ||
    restaurantInfo?.brandBackgroundImage ||
    restaurantHeroFallback;
  const hideBottomNav =
    showFeedback ||
    showOffers ||
    showGuestAssist ||
    showWaiters ||
    showPromoModal ||
    showFirstScanChoice;

  useEffect(() => {
    document.body.style.overflow = hideBottomNav ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [hideBottomNav]);

  return (
    <PageTransition>
      <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-[#fafaf7] flex flex-col items-center pb-28 font-sans text-gray-950">
        {/* Top hero + table card. We collapse this whole block when the
            customer expands the inline menu â€” that's the "top section goes
            up and hides" animation the new design calls for. */}
        <AnimatePresence initial={false}>
          {!menuExpanded && (
            <m.div
              key="home-hero-block"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -80, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="flex w-full flex-col items-center"
            >
              {/* Compact hero â€” smaller min-h, tighter content, fade into bg. */}
              <div
                className="relative flex min-h-[32vh] w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center px-6 pb-10 pt-14 text-white"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.32), rgba(15,23,42,0.88)), url('${heroImage}')`,
                }}
              >
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fafaf7] to-transparent" />

                <div className="absolute left-0 right-0 top-5 z-20 flex justify-between px-5">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="rounded-xl border border-white/30 bg-white/20 p-2.5 text-white backdrop-blur-md transition-all active:scale-90"
                    aria-label="Open menu"
                  >
                    <Menu size={20} />
                  </button>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="rounded-xl border border-white/30 bg-white/20 p-2.5 text-white backdrop-blur-md transition-all active:scale-90"
                    aria-label="Open profile"
                  >
                    <User size={20} />
                  </button>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/15 shadow-xl backdrop-blur">
                    {restaurantInfo?.logo ? (
                      <img src={restaurantInfo.logo} alt={restaurantInfo?.name || "Restaurant"} className="h-full w-full object-cover" />
                    ) : (
                      <Utensils size={22} />
                    )}
                  </div>
                  <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur">
                    <QrCode size={10} />
                    QR table ordering
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight">{restaurantInfo?.name || restaurantDisplayName}</h1>
                  <p className="mx-auto mt-1.5 max-w-[20rem] text-[11px] leading-5 text-white/80">
                    {(() => {
                      const clean = (s) => {
                        const v = typeof s === "string" ? s.trim() : "";
                        return !v || v.toLowerCase() === "undefined" || v.toLowerCase() === "null" ? "" : v;
                      };
                      return (
                        clean(restaurantInfo?.tagline) ||
                        clean(restaurantInfo?.description) ||
                        "Order directly from your table."
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Slim glass info chip â€” replaces the heavy white card. Three
                  segments: Table | Reward pts | Scan another. */}
              <div className="relative -mt-6 z-10 flex w-[92%] max-w-md items-center gap-2 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50/80 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Table</span>
                  <span className="ml-auto text-lg font-black leading-none text-gray-950">
                    {loading ? "--" : tableNumber.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-primary-50/80 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary-600">Reward</span>
                  <span className="ml-auto text-sm font-black leading-none text-primary-800">
                    {loyaltyPoints != null ? loyaltyPoints : 0} pts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  aria-label="Scan another QR"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white shadow-sm transition active:scale-95"
                >
                  <QrCode size={15} />
                </button>
              </div>

              {promoBanners.length > 0 && (
                <div className="mt-6 w-[90%] max-w-md space-y-3">
                  {promoBanners.slice(0, 2).map((promo) => (
                    <div key={promo._id} className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Today&apos;s offer</p>
                          <h3 className="mt-1 text-base font-semibold text-gray-950">{promo.bannerText || promo.name}</h3>
                          <p className="mt-1 text-xs font-semibold text-gray-500">Use code {promo.code} on checkout</p>
                        </div>
                        <div className="rounded-2xl px-3 py-2 text-sm font-black text-white" style={{ backgroundColor: promo.bannerColor || "#f97316" }}>
                          {promo.discountType === "percent" ? `${promo.discountValue}%` : `Rs. ${promo.discountValue}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Inline menu list â€” always visible. Shows the first 3 categories
            as a preview; tapping "View full menu" expands to the full list
            and (via AnimatePresence above) the hero block slides up out. */}
        <MenuPreview
          slug={slug}
          token={token}
          categories={menuCategories}
          loading={menuLoading}
          expanded={menuExpanded}
          onToggle={toggleMenuExpanded}
        />

        <p className="mt-12 text-xs text-gray-400">
          Powered by <span className="font-bold uppercase tracking-widest text-gray-600 text-[10px]">QR Restro Nepal</span>
        </p>

        <SideBar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCallAssist={() => setShowGuestAssist(true)}
          onOffers={() => setShowOffers(true)}
          onFeedback={() => setShowFeedback(true)}
          offersCount={promoBanners.length}
        />
        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setProfileDefaultOpenAuth(false);
          }}
          guestId={guestIdLocal}
          customerId={customerId}
          customer={customerProfile}
          tableNumber={tableNumber}
          rewardPoints={loyaltyPoints}
          onRequestOtp={handleRequestCustomerOtp}
          onCreateId={handleCreateCustomerId}
          onRequestPasswordReset={handleRequestPasswordReset}
          onVerifyPasswordResetOtp={handleVerifyPasswordResetOtp}
          onResetPassword={handleResetPassword}
          onEndSession={handleEndSession}
          defaultOpenAuth={profileDefaultOpenAuth}
          initialMode={profileInitialMode}
        />
        {showFirstScanChoice && (
          <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 px-4 pb-8 pt-12 backdrop-blur-sm sm:items-center sm:pb-12">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <User size={26} />
              </div>
              <h2 className="text-center text-xl font-semibold text-gray-950">How would you like to continue?</h2>
              <p className="mx-auto mt-2 max-w-xs text-center text-sm font-semibold leading-6 text-gray-500">
                Order as a guest now, or login/signup to keep all orders and reward points under one ID.
              </p>
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-black text-gray-800"
                >
                  Use as guest
                  <User size={18} className="text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => openAuthProfile("signup")}
                  className="flex w-full items-center justify-between rounded-2xl bg-primary-600 px-4 py-3 text-left text-sm font-black text-white"
                >
                  Sign up and save rewards
                  <BadgePlus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => openAuthProfile("login")}
                  className="flex w-full items-center justify-between rounded-2xl bg-gray-950 px-4 py-3 text-left text-sm font-black text-white"
                >
                  Login with password
                  <LogIn size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        <Waiters isOpen={showWaiters} onClose={() => setShowWaiters(false)} />
        {showGuestAssist && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuestAssist(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            />
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            >
              <div className="flex justify-center pt-3">
                <div className="h-1 w-10 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                    <BellRing size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold leading-none text-gray-800">Need something?</h2>
                    <p className="mt-0.5 text-[11px] text-gray-400">We alert the restaurant in real time</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                  onClick={() => setShowGuestAssist(false)}
                  aria-label="Close assist"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mx-5 h-px bg-gray-100" />
              <div className="grid grid-cols-2 gap-2 px-5 pb-6 pt-4">
                {[
                  { type: "call_waiter", label: "Call waiter" },
                  { type: "need_water", label: "Water" },
                  { type: "need_tissue", label: "Tissue" },
                  { type: "need_bill", label: "Bill" },
                ].map((btn) => (
                  <button
                    key={btn.type}
                    type="button"
                    disabled={assistSending}
                    onClick={() => sendGuestRequest(btn.type)}
                    className="rounded-2xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </m.div>
          </>
        )}
        <Offers isOpen={showOffers} onClose={() => setShowOffers(false)} slug={slug} />
        <Feedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
        <PromoCodeModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          promos={promoBanners}
          onViewAllOffers={() => setShowOffers(true)}
        />
        <Navigation hidden={hideBottomNav} />
      </div>
      </LazyMotion>
    </PageTransition>
  );
}

/**
 * Maps the current local hour to a "daypart" â€” the slot of day used to bias
 * the featured-item picker (breakfast at 7am, lunch at noon, etc). Patterns
 * are tested against both category names and item names so a restaurant that
 * uses "Chiya & coffee" or "Lunch thali" surfaces at the right hour.
 */
function getDaypart(date = new Date()) {
  const hour = date.getHours();
  if (hour < 10)
    return {
      key: "breakfast",
      label: "Breakfast",
      tagline: "Start your day right",
      patterns: /breakfast|brunch|coffee|tea|chiya|morning|set|toast|egg/i,
    };
  if (hour < 12)
    return {
      key: "brunch",
      label: "Brunch",
      tagline: "Mid-morning picks",
      patterns: /brunch|breakfast|coffee|tea|chiya|set|toast|sandwich/i,
    };
  if (hour < 15)
    return {
      key: "lunch",
      label: "Lunch",
      tagline: "Lunchtime favourites",
      patterns: /lunch|main|rice|noodle|momo|burger|pizza|thali|set|chowmein|biryani/i,
    };
  if (hour < 18)
    return {
      key: "snacks",
      label: "Snacks",
      tagline: "Easy bites for the afternoon",
      patterns: /snack|appetizer|starter|chiya|coffee|tea|momo|chowmein|fried|chaat|samosa/i,
    };
  if (hour < 22)
    return {
      key: "dinner",
      label: "Dinner",
      tagline: "Dinner picks",
      patterns: /dinner|main|special|grill|tandoor|biryani|rice|momo|pizza|burger|thali/i,
    };
  return {
    key: "late",
    label: "Late night",
    tagline: "Late-night cravings",
    patterns: /dessert|drink|chiya|coffee|tea|cake|sweet|cold/i,
  };
}

/**
 * Picks `count` items from the menu, ranked by:
 *   1. category/name matching the current daypart (Breakfast â†’ /breakfast|coffee/...)
 *   2. flagged popular/featured items
 *   3. category sort order as a stable tiebreaker
 * Returns an empty array when the menu hasn't loaded yet.
 */
function pickFeaturedItems(categories, count = 4) {
  const daypart = getDaypart();
  const pool = [];
  (categories || []).forEach((cat) => {
    (cat.items || []).forEach((it) => {
      if (it?.isAvailable === false) return;
      const matchesDaypart =
        daypart.patterns.test(cat?.name || "") ||
        daypart.patterns.test(it?.name || "");
      pool.push({
        ...it,
        _categoryName: cat?.name || "",
        _categoryImage: cat?.image || null,
        _matchesDaypart: matchesDaypart,
      });
    });
  });

  pool.sort((a, b) => {
    if (a._matchesDaypart !== b._matchesDaypart)
      return Number(b._matchesDaypart) - Number(a._matchesDaypart);
    const aPop = a.isPopular || a.popular || a.featured ? 1 : 0;
    const bPop = b.isPopular || b.popular || b.featured ? 1 : 0;
    if (aPop !== bPop) return bPop - aPop;
    return (a.name || "").localeCompare(b.name || "");
  });

  return { items: pool.slice(0, count), daypart };
}

/**
 * Inline menu shown on the customer Home page. Two visual modes:
 *
 *   - collapsed: 4 featured items in a 2Ã—2 card grid, chosen dynamically by
 *     time of day (breakfast/lunch/snacks/dinner/late). Tapping a card opens
 *     the item details page.
 *   - expanded: the full categories list slides in (with the hero block
 *     collapsing upward via AnimatePresence in the parent).
 */
function MenuPreview({ slug, token, categories, loading, expanded, onToggle }) {
  const FEATURED_COUNT = 4;
  // Recompute featured items on every render â€” cheap enough and keeps the
  // selection in sync if the daypart crosses an hour while the page is open.
  const { items: featuredItems, daypart } = pickFeaturedItems(
    categories,
    FEATURED_COUNT,
  );
  const hasFeatured = featuredItems.length > 0;
  const moreCount = expanded ? 0 : categories.length;

  return (
    <section className="mt-5 w-[92%] max-w-md">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-700">
            {expanded ? "Full menu" : `${daypart.label} picks`}
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold leading-tight text-gray-950">
            <UtensilsCrossed size={18} className="text-primary-600" />
            {expanded
              ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`
              : daypart.tagline}
          </h3>
        </div>
        {expanded && (
          <m.button
            type="button"
            onClick={onToggle}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-black text-gray-700 shadow-sm"
          >
            <ChevronUp size={14} />
            Close
          </m.button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <m.ul
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="aspect-[5/4] w-full animate-pulse bg-gray-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-gray-100" />
                </div>
              </li>
            ))}
          </m.ul>
        ) : !expanded ? (
          // Collapsed: 2Ã—2 grid of featured items.
          hasFeatured ? (
            <m.ul
              key="featured-items"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="grid grid-cols-2 gap-3"
            >
              {featuredItems.map((item, idx) => (
                <m.li
                  key={item._id || item.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.32,
                    delay: idx * 0.04,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                >
                  <FeaturedItemCard slug={slug} token={token} item={item} />
                </m.li>
              ))}
            </m.ul>
          ) : (
            <m.div
              key="empty-featured"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center"
            >
              <p className="text-sm font-black text-gray-800">Menu coming soon</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">
                The restaurant hasn&apos;t published items yet.
              </p>
            </m.div>
          )
        ) : (
          // Expanded: full categories list (slides in as hero exits).
          <m.ul
            key="full-categories"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-3"
          >
            {categories.map((cat, idx) => (
              <m.li
                key={cat._id || cat.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: idx * 0.04,
                  ease: [0.32, 0.72, 0, 1],
                }}
              >
                <Link
                  to={`/item/${slug}/${token}/${encodeURIComponent(cat.name)}`}
                  className="group flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm transition active:scale-[0.98] hover:border-primary-200"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <UtensilsCrossed size={22} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-gray-900">
                      {cat.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-400">
                      {Array.isArray(cat.items) && cat.items.length > 0
                        ? `${cat.items.length} item${cat.items.length > 1 ? "s" : ""}`
                        : cat.description || "Tap to explore"}
                    </p>
                  </div>
                  <div className="rounded-full bg-gray-50 p-2 text-gray-500 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600">
                    <ChevronRight size={16} />
                  </div>
                </Link>
              </m.li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>

      {(categories.length > 0 || expanded) && (
        <m.button
          type="button"
          onClick={onToggle}
          whileTap={{ scale: 0.97 }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-white py-3 text-sm font-black text-primary-700 shadow-sm transition active:bg-primary-50"
        >
          {expanded
            ? "Show less"
            : moreCount > 0
              ? `View full menu Â· ${moreCount} categor${moreCount === 1 ? "y" : "ies"}`
              : "View full menu"}
          <m.span
            animate={
              expanded
                ? { rotate: 180, y: 0 }
                : { rotate: 0, y: [0, 4, 0] }
            }
            transition={
              expanded
                ? { duration: 0.3 }
                : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            }
            className="inline-flex"
          >
            <ChevronDown size={18} />
          </m.span>
        </m.button>
      )}
    </section>
  );
}

/**
 * Card used in the 2Ã—2 featured grid. Falls back to the category image when
 * the item itself has no photo, so the grid never looks empty.
 */
function FeaturedItemCard({ slug, token, item }) {
  const image = item.image || item._categoryImage || "";
  const price = Number(item.price ?? item.basePrice ?? 0);
  const isPopular = Boolean(item.isPopular || item.popular || item.featured);
  return (
    <Link
      to={`/item-detail/${slug}/${token}/${item._id}`}
      className="group block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition active:scale-[0.97]"
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <UtensilsCrossed size={28} />
          </div>
        )}
        {isPopular && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-950 shadow">
            Popular
          </span>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black text-primary-700 shadow">
          Rs. {price.toFixed(0)}
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-[9px] font-black uppercase tracking-wider text-primary-600">
          {item._categoryName || "Featured"}
        </p>
        <p className="mt-0.5 line-clamp-1 text-sm font-black leading-tight text-gray-900">
          {item.name}
        </p>
      </div>
    </Link>
  );
}
