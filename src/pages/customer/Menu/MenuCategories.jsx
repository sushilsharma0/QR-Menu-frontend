import React, { useEffect, useMemo, useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  Search,
  BellRing,
  ChevronRight,
  Menu as MenuIcon,
  X,
  ChefHat,
  Sparkles,
  Flame,
  UtensilsCrossed,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../../components/customer/Navigation";
import PageTransition from "../../../components/customer/PageTransition";
import Sidebar from "../../../components/customer/homepage/SideBar";
import ViewCartBtn from "../../../components/customer/ViewCartBtn";
import CartDrawer from "../../../components/customer/CartDrawer";
import Offers from "../../../components/customer/homepage/Offers";
import Feedback from "../../../components/customer/homepage/Feedback";
import api from "../../../services/api";
import {
  ensureGuestSession,
  getDiningInsights,
  getRestaurantInfo,
  postGuestTableRequest,
} from "../../../services/customer";
import VoiceSearchButton from "../../../components/customer/VoiceSearchButton";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";
import { useCustomerCart } from "../../../context/CustomerCartContext";

const MenuCategories = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [insights, setInsights] = useState(null);
  const guestIdRef = React.useRef("");
  const [showOffers, setShowOffers] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showGuestAssist, setShowGuestAssist] = useState(false);
  const [assistSending, setAssistSending] = useState(false);
  const [offersCount, setOffersCount] = useState(0);

  const { slug, token } = useParams();
  const { hydrate } = useCustomerCart();

  useEffect(() => {
    if (slug) {
      fetchMenuData();
      fetchRestaurantBrand();
    }
    if (token) hydrate(token);
  }, [slug, token, hydrate]);

  useEffect(() => {
    const run = async () => {
      if (!slug || !token) return;
      try {
        const s = await ensureGuestSession(token);
        guestIdRef.current = s.guestId || "";
        const data = await getDiningInsights({
          restaurantSlug: slug,
          guestId: s.guestId,
          qrToken: token,
        });
        setInsights(data);
      } catch {
        setInsights(null);
      }
    };
    run();
  }, [slug, token]);

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/customer/offers/${slug}`, { skipErrorToast: true })
      .then((res) => {
        const items = Array.isArray(res?.data?.data) ? res.data.data : [];
        const active = items.filter((promo) => {
          if (!promo?.endAt) return true;
          return new Date(promo.endAt) > new Date();
        });
        setOffersCount(active.length);
      })
      .catch(() => setOffersCount(0));
  }, [slug]);

  const sendGuestRequest = async (requestType) => {
    if (!guestIdRef.current || !token) return;
    try {
      setAssistSending(true);
      await postGuestTableRequest({ qrToken: token, guestId: guestIdRef.current, requestType });
      setShowGuestAssist(false);
    } catch (err) {
      console.error("Could not send guest request", err);
    } finally {
      setAssistSending(false);
    }
  };

  const overlayOpen = isSidebarOpen || showOffers || showFeedback || showGuestAssist;

  useEffect(() => {
    document.body.style.overflow = showGuestAssist ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showGuestAssist]);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const qs = token ? `?qrToken=${encodeURIComponent(token)}` : "";
      const response = await api.get(`/restaurant/menu/public/${slug}${qs}`);
      const menuData = response.data.data.menu || [];
      setCategories(menuData);
    } catch (error) {
      console.error("Failed to fetch menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantBrand = async () => {
    try {
      const info = await getRestaurantInfo(slug, token);
      setRestaurantInfo(info);
    } catch (error) {
      setRestaurantInfo(null);
    }
  };

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => {
      const inName = cat.name?.toLowerCase().includes(q);
      const inDesc = cat.description?.toLowerCase().includes(q);
      const inItems = (cat.items || []).some((it) =>
        it.name?.toLowerCase().includes(q),
      );
      return inName || inDesc || inItems;
    });
  }, [categories, searchQuery]);

  const totalDishes = useMemo(
    () =>
      categories.reduce(
        (acc, c) => acc + (c.itemCount || c.items?.length || 0),
        0,
      ),
    [categories],
  );

  const handleSearchToggle = () => {
    setShowSearch((prev) => !prev);
    setSearchQuery("");
  };

  return (
    <PageTransition>
      <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-surface-50/60 pb-44 text-gray-950">
        <Header
          showSearch={showSearch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchToggle={handleSearchToggle}
          onMenu={() => setIsSidebarOpen(true)}
          restaurantName={restaurantInfo?.name}
        />

        <RestaurantBanner
          info={restaurantInfo}
          totalDishes={totalDishes}
          categoryCount={categories.length}
          loading={loading}
        />

        {insights?.pairs?.length > 0 && (
          <InsightStrip pairs={insights.pairs} />
        )}

        {insights?.trending?.length > 0 && (
          <TrendingStrip
            items={insights.trending}
            daypart={insights.daypart}
            slug={slug}
            token={token}
          />
        )}

        <CategoriesSection
          loading={loading}
          searchQuery={searchQuery}
          categories={filteredCategories}
          allCategories={categories}
          slug={slug}
          token={token}
          onClearSearch={() => setSearchQuery("")}
        />

        <ViewCartBtn hidden={overlayOpen} />
        <Navigation hidden={overlayOpen} />
        <CartDrawer />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCallAssist={() => setShowGuestAssist(true)}
          onOffers={() => setShowOffers(true)}
          onFeedback={() => setShowFeedback(true)}
          offersCount={offersCount}
        />
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
      </div>
      </LazyMotion>
    </PageTransition>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Header â€” sticky, glassy, with sliding search input
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function Header({
  showSearch,
  searchQuery,
  onSearchChange,
  onSearchToggle,
  onMenu,
  restaurantName,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 pt-12 pb-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        {!showSearch ? (
          <m.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={onMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition active:bg-gray-200"
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </m.button>
        ) : (
          <div className="h-10 w-2" />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {showSearch ? (
            <m.div
              key="search"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeInOut" }}
              className="mx-2 flex flex-1 items-center gap-2 overflow-hidden rounded-xl bg-gray-100 px-3"
            >
              <Search size={15} className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search dishes or tap mic..."
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="text-gray-400"
                >
                  <X size={14} />
                </button>
              )}
              <VoiceSearchButton
                onTranscript={(text) => onSearchChange(text.trim())}
                ariaLabel="Voice search menu"
              />
            </m.div>
          ) : (
            <m.div
              key="title"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 text-center"
            >
              <h1 className="truncate text-base font-semibold tracking-tight text-gray-900">
                {restaurantName || "Our Menu"}
              </h1>
              <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-700">
                <UtensilsCrossed size={10} strokeWidth={2.5} />
                Browse categories
              </p>
            </m.div>
          )}
        </AnimatePresence>

        <m.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={onSearchToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition active:bg-gray-200"
          aria-label={showSearch ? "Close search" : "Open search"}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={showSearch ? "close" : "search"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {showSearch ? <X size={18} /> : <Search size={18} />}
            </m.div>
          </AnimatePresence>
        </m.button>
      </div>
    </header>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Restaurant Banner â€” replaces the heavy dark hero with a warm, light
   glassmorphic surface that breathes with the rest of the design.
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function RestaurantBanner({ info, totalDishes, categoryCount, loading }) {
  const tagline =
    info?.tagline ||
    info?.description ||
    "Curated dishes, sent straight to the kitchen.";
  const hasCover = Boolean(info?.backgroundPhoto);

  return (
    <section className="px-4 pt-4">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-primary-100/80 bg-white shadow-[0_12px_30px_-18px_rgba(122,34,0,0.22)]"
      >
        {/* Cover image / decorative gradient */}
        <div
          className="relative h-32 w-full overflow-hidden"
          style={
            hasCover
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(57,16,0,0.55), rgba(143,40,0,0.35)), url('${info.backgroundPhoto}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  backgroundImage:
                    "radial-gradient(120% 90% at 0% 0%, #b64a26 0%, transparent 55%), radial-gradient(120% 90% at 100% 100%, #391000 0%, transparent 60%), linear-gradient(135deg, #7a2200 0%, #8f2800 45%, #b64a26 100%)",
                }
          }
        >
          {/* SVG dot pattern adds warmth + depth on the plain gradient */}
          {!hasCover && (
            <svg
              aria-hidden
              className="absolute inset-0 h-full w-full opacity-[0.18] mix-blend-screen"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="banner-dots"
                  x="0"
                  y="0"
                  width="14"
                  height="14"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1" fill="#ffffff" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#banner-dots)" />
            </svg>
          )}

          {/* Soft colored blobs for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-attention-300/40 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/20 blur-2xl"
          />

          {/* Decorative utensil icons floating in the cover */}
          {!hasCover && (
            <>
              <m.div
                aria-hidden
                initial={{ rotate: -8, y: -2 }}
                animate={{ rotate: -2, y: 2 }}
                transition={{ duration: 3.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="absolute right-4 top-3 text-white/20"
              >
                <UtensilsCrossed size={42} strokeWidth={1.5} />
              </m.div>
              <m.div
                aria-hidden
                initial={{ rotate: 12, y: 0 }}
                animate={{ rotate: 6, y: -3 }}
                transition={{ duration: 4.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="absolute right-16 bottom-2 text-white/15"
              >
                <ChefHat size={36} strokeWidth={1.5} />
              </m.div>
            </>
          )}

          {/* Welcome ribbon â€” top-left */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/95 ring-1 ring-white/20 backdrop-blur">
            <Sparkles size={10} strokeWidth={2.5} />
            Welcome to our menu
          </div>
        </div>

        <div className="relative z-10 -mt-7 px-4 pb-4">
          <div className="rounded-[1.35rem] border border-white/70 bg-white p-3 shadow-[0_14px_32px_-18px_rgba(15,23,42,0.32)] ring-1 ring-primary-100/50">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-2 ring-white">
              {info?.logo ? (
                <img
                  src={info.logo}
                  alt={info?.name || "Restaurant"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ChefHat size={28} className="text-primary-700" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-black leading-tight text-gray-900">
                {info?.name || "Restaurant menu"}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-gray-500">
                {tagline}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatChip
              label="Sections"
              value={loading ? "â€¦" : categoryCount}
              tone="primary"
            />
            <StatChip
              label="Dishes"
              value={loading ? "â€¦" : totalDishes || "â€”"}
              tone="accent"
            />
            <StatChip
              label="Live menu"
              value={
                <span className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  On
                </span>
              }
              tone="emerald"
              small
            />
          </div>
          </div>
        </div>
      </m.div>
    </section>
  );
}

function StatChip({ label, value, tone = "primary", small }) {
  const tones = {
    primary: "bg-primary-50/70 text-primary-800 ring-primary-100",
    accent: "bg-amber-50 text-amber-800 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  }[tone];
  return (
    <div
      className={`flex flex-1 items-center justify-between gap-2 rounded-2xl px-3 py-2 ring-1 ${tones}`}
    >
      <span className="text-[9px] font-black uppercase tracking-wider opacity-75">
        {label}
      </span>
      <span
        className={`${small ? "text-[11px]" : "text-sm"} font-black tabular-nums`}
      >
        {value}
      </span>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Insight Strip â€” pairing tips from server, presented as soft cards
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function InsightStrip({ pairs }) {
  return (
    <section className="px-4 pt-4">
      <SectionTitle icon={Sparkles} label="You may also like" />
      <div className="mt-2 space-y-2 rounded-2xl border border-primary-100/60 bg-gradient-to-br from-white to-surface-50/70 p-3 shadow-sm">
        {pairs.slice(0, 2).map((p) => (
          <p
            key={`${p.name || p.title || p.label}-${p.reason || p.description || ''}`}
            className="flex items-start gap-2 text-xs font-semibold leading-snug text-gray-700"
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Sparkles size={9} strokeWidth={2.5} />
            </span>
            {p.caption}
          </p>
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Trending Strip â€” horizontal scroll, with rank badge + today count
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function TrendingStrip({ items, daypart, slug, token }) {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Flame} label="Trending now" tone="primary" />
        {daypart && (
          <span className="inline-flex items-center gap-1 rounded-full bg-attention-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
            <Star size={10} strokeWidth={2.5} />
            {daypart}
          </span>
        )}
      </div>

      <div className="mt-2 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.slice(0, 10).map((item, idx) => (
          <Link
            key={item._id}
            to={`/item-detail/${slug}/${token}/${item._id}`}
            className="group relative w-32 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition active:scale-[0.97]"
          >
            <div className="relative h-20 w-full overflow-hidden bg-gray-100">
              <img
                src={
                  item.image ||
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=60"
                }
                alt={item.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span
                className={`absolute left-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white shadow-md ${
                  idx === 0
                    ? "bg-gradient-to-br from-amber-400 to-amber-600"
                    : idx === 1
                    ? "bg-gradient-to-br from-zinc-300 to-zinc-500"
                    : idx === 2
                    ? "bg-gradient-to-br from-orange-400 to-orange-700"
                    : "bg-primary-700/85"
                }`}
              >
                {idx + 1}
              </span>
            </div>
            <div className="px-2.5 py-2">
              <p className="line-clamp-1 text-[11px] font-black text-gray-900">
                {item.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-primary-700">
                <Flame size={9} strokeWidth={2.5} />
                {item.orderCountToday || 0} today
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ icon: Icon, label, tone = "default" }) {
  const toneClass =
    tone === "primary"
      ? "text-primary-700"
      : "text-gray-500";
  return (
    <p
      className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide ${toneClass}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {label}
    </p>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Categories Section â€” grid of cards
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CategoriesSection({
  loading,
  searchQuery,
  categories,
  allCategories,
  slug,
  token,
  onClearSearch,
}) {
  return (
    <section className="px-4 pt-5">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <SectionTitle icon={UtensilsCrossed} label="Browse categories" />
          {!loading && allCategories.length > 0 && (
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {searchQuery
                ? `${categories.length} match${categories.length === 1 ? "" : "es"}`
                : `${allCategories.length} sections`}
            </span>
          )}
        </div>

        <div className="mt-3">
          {loading ? (
            <CategoryGridSkeleton />
          ) : categories.length === 0 ? (
            <EmptyState
              searching={Boolean(searchQuery)}
              onClearSearch={onClearSearch}
            />
          ) : (
            <m.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              {categories.map((cat, idx) => (
                <CategoryCard
                  key={cat._id || cat.name}
                  cat={cat}
                  slug={slug}
                  token={token}
                  index={idx}
                />
              ))}
            </m.div>
          )}
        </div>
      </div>
    </section>
  );
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
};

function CategoryCard({ cat, slug, token, index }) {
  const itemCount = cat.itemCount ?? (cat.items?.length || 0);
  return (
    <m.div variants={cardVariants}>
      <Link
        to={`/item/${slug}/${token}/${encodeURIComponent(cat.name)}`}
        className="group relative block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-all active:scale-[0.97]"
      >
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-gray-100">
          {cat.image ? (
            <img
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-surface-50 text-primary-700">
              <UtensilsCrossed size={28} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

          {itemCount > 0 && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-black text-primary-700 shadow-sm backdrop-blur">
              {itemCount} {itemCount === 1 ? "dish" : "dishes"}
            </span>
          )}

          {index === 0 && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-attention-300 to-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900 shadow-sm ring-1 ring-amber-300">
              <Sparkles size={9} strokeWidth={2.5} />
              Popular
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="line-clamp-1 text-sm font-black tracking-tight text-white drop-shadow">
              {cat.name}
            </p>
            {cat.description && (
              <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-white/85">
                {cat.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Tap to view
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition group-hover:bg-primary-600 group-hover:text-white">
            <ChevronRight size={14} strokeWidth={2.5} />
          </span>
        </div>
      </Link>
    </m.div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Skeleton + Empty states
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-gray-100 bg-white"
        >
          <div className="aspect-[5/4] w-full animate-pulse bg-gray-100" />
          <div className="flex items-center justify-between p-3">
            <div className="h-2.5 w-16 animate-pulse rounded-full bg-gray-100" />
            <div className="h-7 w-7 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searching, onClearSearch }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-primary-200/70 bg-gradient-to-br from-white via-surface-50/50 to-primary-50/40 px-6 py-14 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-attention-300/20 blur-2xl"
      />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-md ring-1 ring-primary-100">
        {searching ? <Search size={22} /> : <UtensilsCrossed size={22} />}
      </div>
      <p className="relative mt-4 text-sm font-black text-gray-900">
        {searching ? "No matches found" : "Menu not ready yet"}
      </p>
      <p className="relative mx-auto mt-1 max-w-[18rem] text-xs font-semibold text-gray-500">
        {searching
          ? "Try a different keyword or tap the mic for voice search."
          : "The kitchen hasn't published any dishes. Please check back in a bit."}
      </p>
      {searching && (
        <m.button
          whileTap={{ scale: 0.96 }}
          onClick={onClearSearch}
          className="relative mx-auto mt-4 inline-flex items-center gap-1.5 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-2 text-[11px] font-black text-primary-700"
        >
          Clear search
        </m.button>
      )}
    </m.div>
  );
}

export default MenuCategories;
