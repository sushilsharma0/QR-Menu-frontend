import React, { useEffect, useMemo } from "react";
import {
  Home,
  UtensilsCrossed,
  ConciergeBell,
  UserRound,
  ShoppingCart,
} from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { readCustomerPortal, rememberCustomerPortal } from "../../utils/customerPortalContext";
import { useCustomerCart } from "../../context/CustomerCartContext";

function pathMatchesTab(pathname, tab, slug, token) {
  if (pathname === tab.path) return true;
  if (tab.path.includes("/menu/")) {
    return (
      pathname.startsWith(`/menu/${slug}/${token}`) ||
      pathname.startsWith(`/item/${slug}/${token}/`) ||
      pathname.startsWith(`/item-detail/${slug}/${token}/`)
    );
  }
  if (tab.path.includes("/cart/")) {
    return pathname.startsWith(`/cart/${slug}/${token}`);
  }
  if (tab.path.includes("/home/")) {
    return (
      pathname.startsWith(`/home/${slug}/${token}`) ||
      pathname.startsWith(`/about/${slug}/${token}`) ||
      pathname.startsWith(`/settings/${slug}/${token}`) ||
      pathname.startsWith(`/privacy/${slug}/${token}`) ||
      pathname.startsWith(`/credit-apply/${slug}/${token}`)
    );
  }
  if (tab.path.includes("/orders/")) {
    return (
      pathname.startsWith(`/orders/${slug}/${token}`) ||
      pathname.startsWith("/order/track/") ||
      pathname.startsWith("/order/bill/")
    );
  }
  if (tab.path.includes("/account/")) {
    return pathname.startsWith(`/account/${slug}/${token}`);
  }
  return false;
}

export default function Navigation({
  restaurantSlug: slugProp,
  tableQrToken: tokenProp,
  hidden = false,
}) {
  const routerLocation = useLocation();
  const params = useParams();
  const fromParamsSlug = params.slug || "";
  const fromParamsToken = params.token || "";
  const fallback = readCustomerPortal();
  const activeSlug = fromParamsSlug || slugProp || fallback.slug;
  const activeToken = fromParamsToken || tokenProp || fallback.token;

  const { totals } = useCustomerCart();
  const cartCount = totals?.count ?? 0;

  useEffect(() => {
    if (fromParamsSlug && fromParamsToken) {
      rememberCustomerPortal(fromParamsSlug, fromParamsToken);
    }
  }, [fromParamsSlug, fromParamsToken]);

  const tabs = useMemo(() => {
    if (!activeSlug || !activeToken) return [];
    const encSlug = activeSlug;
    const encToken = activeToken;
    return [
      { path: `/home/${encSlug}/${encToken}`, icon: Home, label: "Home" },
      { path: `/menu/${encSlug}/${encToken}`, icon: UtensilsCrossed, label: "Menu" },
      { path: `/cart/${encSlug}/${encToken}`, icon: ShoppingCart, label: "Cart", showBadge: true },
      { path: `/orders/${encSlug}/${encToken}`, icon: ConciergeBell, label: "Orders" },
      { path: `/account/${encSlug}/${encToken}`, icon: UserRound, label: "More" },
    ];
  }, [activeSlug, activeToken]);

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex((t) =>
      pathMatchesTab(routerLocation.pathname, t, activeSlug, activeToken),
    );
    return idx >= 0 ? idx : 0;
  }, [routerLocation.pathname, tabs, activeSlug, activeToken]);

  if (!activeSlug || !activeToken || tabs.length === 0) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.nav
      aria-label="Customer navigation"
      initial={false}
      animate={{ y: hidden ? 110 : 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="customer-bottom-nav pointer-events-none fixed bottom-0 left-0 right-0 z-[90] flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:px-4"
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-stretch rounded-[1.4rem] border border-white/40 bg-white/80 p-0.5 shadow-[0_-12px_40px_-12px_rgba(57,16,0,0.18)] ring-1 ring-primary-900/5 backdrop-blur-2xl dark:border-gray-700/60 dark:bg-gray-900/90 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)]">
        <div className="relative flex flex-1 justify-between">
          <m.div
            layout
            className="absolute bottom-0.5 left-0 top-0.5 rounded-[1.1rem] bg-gradient-to-br from-primary-600/20 via-primary-500/15 to-secondary-500/15 ring-1 ring-primary-600/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${activeIndex * (100 / tabs.length)}%`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
          {tabs.map((tab) => {
            const isActive = pathMatchesTab(routerLocation.pathname, tab, activeSlug, activeToken);
            const Icon = tab.icon;
            const badge = tab.showBadge && cartCount > 0 ? cartCount : null;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
              >
                <m.div
                  whileTap={{ scale: 0.86 }}
                  animate={{
                    scale: isActive ? 1.06 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${
                    isActive ? "text-primary-700" : "text-gray-400"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.35 : 2} />
                  <AnimatePresence>
                    {badge != null && (
                      <m.span
                        key={badge}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -right-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary-600 px-1 text-[9px] font-black text-white ring-2 ring-white shadow-sm"
                      >
                        {badge > 99 ? "99+" : badge}
                      </m.span>
                    )}
                  </AnimatePresence>
                </m.div>
                <span
                  className={`max-w-full truncate px-0.5 text-[9px] font-black leading-none sm:text-[10px] ${
                    isActive ? "text-primary-800" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
      </m.nav>
    </LazyMotion>
  );
}
