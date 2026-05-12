import React, { useEffect, useState } from "react";
import {
  BadgePlus,
  ChefHat,
  ClipboardList,
  LogIn,
  Menu,
  MessageSquare,
  Phone,
  QrCode,
  Radio,
  Tag,
  User,
  Utensils,
} from "lucide-react";
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
  getStoredCustomerId,
  getCustomerIdentity,
  getRestaurantInfo,
  getGuestLoyalty,
  postGuestTableRequest,
} from "../../../services/customer";
import toast from "react-hot-toast";
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
  const [promoModalShown, setPromoModalShown] = useState(false);
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
  const { slug, token } = useParams();

  const restaurantDisplayName = slug
    ? decodeURIComponent(slug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Restaurant";

  useEffect(() => {
    if (!slug || !token) return;
    const storedCustomerId = getStoredCustomerId();
    const storedGuestId = localStorage.getItem("customer_guest_id_v1") || "";
    setCustomerId(storedCustomerId);
    if (!storedCustomerId && !storedGuestId && !sessionStorage.getItem(`customer_entry_choice_${token}`)) {
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

  const fetchPromoBanners = async () => {
    try {
      if (!slug) return;
      const res = await api.get(`/customer/offers/${slug}`);
      const promos = res?.data?.data || [];
      setPromoBanners(promos);
      if (!promoModalShown && promos.length > 0) {
        setShowPromoModal(true);
        setPromoModalShown(true);
      }
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
      setPromoBanners([]);
    }
  };

  const handleScanSuccess = (data) => {
    toast.success(`QR scanned: ${data}`);
  };

  const shareMenuLink = async () => {
    const path = `/menu/${slug}/${token}`;
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: restaurantInfo?.name || "Menu",
          text: "Order from our table menu",
          url,
        });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
      }
    } catch {
      await navigator.clipboard?.writeText?.(url);
      toast.success("Menu link copied");
    }
  };

  const sendGuestRequest = async (requestType) => {
    if (!guestIdLocal) {
      toast.error("Session not ready — try again.");
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
    localStorage.removeItem("customer_guest_id_v1");
    localStorage.removeItem("customer_identity_id_v1");
    setGuestIdLocal("");
    setCustomerId("");
    setCustomerProfile(null);
    setLoyaltyPoints(0);
    toast.success("Session ended on this device.");
  };

  const heroImage =
    restaurantInfo?.backgroundPhoto ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80";

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#fafaf7] flex flex-col items-center pb-28 font-sans text-gray-950">
        <div
          className="relative flex min-h-[54vh] w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center p-6 text-white"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.28), rgba(15,23,42,0.9)), url('${heroImage}')`,
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fafaf7] to-transparent" />

          <div className="absolute left-0 right-0 top-6 z-20 flex justify-between px-6">
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

          <div className="relative z-10 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/25 bg-white/20 shadow-2xl backdrop-blur-md">
              {restaurantInfo?.logo ? (
                <img src={restaurantInfo.logo} alt={restaurantInfo?.name || "Restaurant"} className="h-full w-full object-cover" />
              ) : (
                <Utensils size={34} />
              )}
            </div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur">
              <QrCode size={14} />
              QR table ordering
            </p>
            <h1 className="text-4xl font-black tracking-tight">{restaurantInfo?.name || restaurantDisplayName}</h1>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/85">
              {(() => {
                const clean = (s) => {
                  const v = typeof s === "string" ? s.trim() : "";
                  return !v || v.toLowerCase() === "undefined" || v.toLowerCase() === "null" ? "" : v;
                };
                return (
                  clean(restaurantInfo?.tagline) ||
                  clean(restaurantInfo?.description) ||
                  "Browse, order, and track your food directly from this table."
                );
              })()}
            </p>
          </div>
        </div>

        <div className="relative -mt-20 flex w-[90%] max-w-md flex-col items-center rounded-[2rem] border border-gray-100 bg-white p-6 text-center shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-500">Your Table</p>
          <h2 className="my-2 text-6xl font-black text-slate-950">{loading ? "--" : tableNumber.toUpperCase()}</h2>
          <div className="grid w-full grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-2 text-[10px] font-black text-gray-500">
            <span className="rounded-xl bg-white py-2">Scan</span>
            <span className="rounded-xl bg-white py-2">Order</span>
            <span className="rounded-xl bg-white py-2">Track</span>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="mt-4 flex items-center gap-2 text-xs text-gray-400 transition-colors hover:text-orange-500"
          >
            <QrCode size={14} /> Scan another QR code
          </button>
          {loyaltyPoints != null && (
            <p className="mt-3 text-sm font-bold text-primary-700">
              Your reward points: {loyaltyPoints} pts
            </p>
          )}
          <Link
            to={`/menu/${slug}/${token}`}
            className="mt-6 w-full rounded-2xl bg-primary-600 py-4 font-black text-white shadow-lg shadow-primary-900/20 transition-all active:scale-95"
          >
            View Menu
          </Link>
          <button
            type="button"
            onClick={shareMenuLink}
            className="mt-3 w-full rounded-2xl border border-gray-200 py-3 text-sm font-black text-gray-800 transition-all active:scale-95"
          >
            Share menu (WhatsApp / apps)
          </button>
          <p className="mt-2 text-[10px] font-semibold text-gray-400">
            Install this menu like an app: use your browser &quot;Add to Home Screen&quot; for quick reopen and offline-friendly caching (PWA).
          </p>
        </div>

        <div className="mt-6 grid w-[90%] max-w-md grid-cols-3 gap-3">
          {[
            { icon: ClipboardList, label: "Choose", text: "Add dishes" },
            { icon: ChefHat, label: "Kitchen", text: "Order sent" },
            { icon: Radio, label: "Live", text: "Track status" },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="rounded-3xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <Icon size={19} />
                </div>
                <p className="text-xs font-black text-gray-900">{step.label}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-gray-400">{step.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid w-[90%] max-w-md grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setShowGuestAssist(true)}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-100"
          >
            <div className="mb-2 rounded-full bg-orange-50 p-3 text-orange-500">
              <Phone size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Call / assist</span>
          </button>

          <button onClick={() => setShowOffers(true)} className="relative flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-100">
            {promoBanners.length > 0 && (
              <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                {promoBanners.length}
              </div>
            )}
            <div className="mb-2 rounded-full bg-orange-50 p-3 text-orange-500">
              <Tag size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Offers</span>
          </button>

          <button onClick={() => setShowFeedback(true)} className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-100">
            <div className="mb-2 rounded-full bg-orange-50 p-3 text-orange-500">
              <MessageSquare size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Feedback</span>
          </button>
        </div>

        {promoBanners.length > 0 && (
          <div className="mt-6 w-[90%] max-w-md space-y-3">
            {promoBanners.slice(0, 2).map((promo) => (
              <div key={promo._id} className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Today&apos;s offer</p>
                    <h3 className="mt-1 text-base font-black text-gray-950">{promo.bannerText || promo.name}</h3>
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

        <p className="mt-12 text-xs text-gray-400">
          Powered by <span className="font-bold uppercase tracking-widest text-gray-600 text-[10px]">QR Restro Nepal</span>
        </p>

        <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
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
              <h2 className="text-center text-xl font-black text-gray-950">How would you like to continue?</h2>
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
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 px-4 pb-8 pt-12">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
              <p className="text-center text-lg font-black text-gray-950">Need something?</p>
              <p className="mt-1 text-center text-xs text-gray-500">
                We alert the restaurant and waiter dashboards in real time.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
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
                    className="rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-800 disabled:opacity-50"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-gray-500"
                onClick={() => setShowGuestAssist(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <Offers isOpen={showOffers} onClose={() => setShowOffers(false)} slug={slug} />
        <Feedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
        <PromoCodeModal isOpen={showPromoModal} onClose={() => setShowPromoModal(false)} promos={promoBanners} />
        <Navigation />
      </div>
    </PageTransition>
  );
}
