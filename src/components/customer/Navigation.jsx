import React from "react";
import {
  Home,
  Menu as MenuIcon,
  ShoppingBag,
  User,
} from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navigation() {
  const location = useLocation();
  const { slug, token } = useParams();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const activeSlug = slug || user.slug || "";
  const activeToken = token || "";

  
  const tabs = [
    { path: `/home/${activeSlug}/${activeToken}`, icon: Home, label: "Home" },
    { path: `/menu/${activeSlug}/${activeToken}`, icon: MenuIcon, label: "Menu" },
    { path: `/orders/${activeSlug}/${activeToken}`, icon: ShoppingBag, label: "Orders" },
    { path: `/account/${activeSlug}/${activeToken}`, icon: User, label: "More" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg">
      <div className="relative flex justify-around items-center py-3">

        {/* Sliding underline */}
        <motion.div
          layout
          className="absolute bottom-0 h-[3px] bg-orange-500 rounded-full"
          style={{
            width: "25%",
            left: `${
              tabs.findIndex((t) => t.path === location.pathname) * 25
            }%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              {/* Glow Effect */}
              {isActive && (
                <motion.div
                  layoutId="glow"
                  className="absolute -top-2 w-12 h-12 bg-orange-500/10 rounded-full blur-xl"
                />
              )}

              {/* Icon */}
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -4 : 0,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`${
                  isActive ? "text-orange-500" : "text-gray-400"
                }`}
              >
                <Icon size={22} />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.6,
                }}
                className={`text-[10px] mt-1 ${
                  isActive ? "text-orange-500 font-semibold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </motion.span>

              {/* Orders Dot */}
              {tab.label === "Orders" && (
                <span className="absolute top-1 right-6 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}