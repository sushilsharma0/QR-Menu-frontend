import React, { useEffect, useMemo } from "react";
import { Home, UtensilsCrossed, ShoppingBag, UserRound } from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { readCustomerPortal, rememberCustomerPortal } from "../../utils/customerPortalContext";

function pathMatchesTab(pathname, tab, slug, token) {
  if (pathname === tab.path) return true;
  if (tab.path.includes("/menu/")) {
    return (
      pathname.startsWith(`/menu/${slug}/${token}`) ||
      pathname.startsWith(`/item/${slug}/${token}/`) ||
      pathname.startsWith(`/item-detail/${slug}/${token}/`) ||
      pathname.startsWith(`/cart/${slug}/${token}`)
    );
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
    return pathname.startsWith(`/orders/${slug}/${token}`);
  }
  if (tab.path.includes("/account/")) {
    return pathname.startsWith(`/account/${slug}/${token}`);
  }
  return false;
}

export default function Navigation({
  restaurantSlug: slugProp,
  tableQrToken: tokenProp,
}) {
  const location = useLocation();
  const params = useParams();
  const fromParamsSlug = params.slug || "";
  const fromParamsToken = params.token || "";
  const fallback = readCustomerPortal();
  const activeSlug = fromParamsSlug || slugProp || fallback.slug;
  const activeToken = fromParamsToken || tokenProp || fallback.token;

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
      { path: `/orders/${encSlug}/${encToken}`, icon: ShoppingBag, label: "Orders" },
      { path: `/account/${encSlug}/${encToken}`, icon: UserRound, label: "More" },
    ];
  }, [activeSlug, activeToken]);

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => pathMatchesTab(location.pathname, t, activeSlug, activeToken));
    return idx >= 0 ? idx : 0;
  }, [location.pathname, tabs, activeSlug, activeToken]);

  if (!activeSlug || !activeToken || tabs.length === 0) {
    return null;
  }

  return (
    <nav className="customer-bottom-nav pointer-events-none fixed bottom-0 left-0 right-0 z-[90] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="pointer-events-auto flex w-full max-w-md items-stretch rounded-[1.35rem] border border-primary-200/40 bg-white/90 px-1 py-1 shadow-[0_-8px_32px_rgba(122,34,0,0.12)] backdrop-blur-xl dark:border-gray-600 dark:bg-gray-900/92 dark:shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
        <div className="relative flex flex-1 justify-around">
          <motion.div
            layout
            className="absolute bottom-1 left-0 top-1 rounded-2xl bg-primary-600/12"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${activeIndex * (100 / tabs.length)}%`,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
          {tabs.map((tab) => {
            const isActive = pathMatchesTab(location.pathname, tab, activeSlug, activeToken);
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className={isActive ? "text-primary-600" : "text-gray-400"}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.25 : 2} />
                </motion.div>
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? "text-primary-700" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
