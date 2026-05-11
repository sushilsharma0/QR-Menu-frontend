import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  ChefHat,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../../components/customer/Navigation";
import PageTransition from "../../../components/customer/PageTransition";
import Sidebar from "../../../components/customer/homepage/SideBar";
import ViewCartBtn from "../../../components/customer/ViewCartBtn";
import api from "../../../services/api";
import { ensureGuestSession, getDiningInsights, getRestaurantInfo } from "../../../services/customer";
import VoiceOrderFAB from "../../../components/customer/VoiceOrderFAB";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";

// const categories = [
//   {
//     id: 1,
//     name: "Starters",
//     count: 12,
//     img: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=200",
//   },
//   {
//     id: 2,
//     name: "Main Course",
//     count: 18,
//     img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
//   },
//   {
//     id: 3,
//     name: "Burgers",
//     count: 10,
//     img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200",
//   },
//   {
//     id: 4,
//     name: "Pizza",
//     count: 8,
//     img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=200",
//   },
//   {
//     id: 5,
//     name: "Drinks",
//     count: 15,
//     img: "https://catering.soulorigin.com.au/cdn/shop/files/SoulOriginCateringSoftDrinks.jpg?v=1732734253",
//   },
//   {
//     id: 6,
//     name: "Desserts",
//     count: 7,
//     img: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=200",
//   },
// ];

const MenuCategories = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [insights, setInsights] = useState(null);

  const { slug, token } = useParams();

  useEffect(() => {
    if (slug) {
      fetchMenuData();
      fetchRestaurantBrand();
    }
  }, [slug]);

  useEffect(() => {
    const run = async () => {
      if (!slug || !token) return;
      try {
        const s = await ensureGuestSession(token);
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
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      // Use public endpoint with restaurant slug
      const response = await api.get(`/restaurant/menu/public/${slug}`);
      // response.data.data contains { restaurant, menu }
      const menuData = response.data.data.menu || [];
      setCategories(menuData);
      console.log('Menu data loaded:', menuData);
    } catch (error) {
      console.error("Failed to fetch menu data:", error);
      // toast.error("Failed to fetch menu data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantBrand = async () => {
    try {
      const info = await getRestaurantInfo(slug);
      setRestaurantInfo(info);
    } catch (error) {
      setRestaurantInfo(null);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name
      .toLowerCase()
      .split(" ") // ["main", "course"]
      .some((word) => word.startsWith(searchQuery.toLowerCase())),
  );

  const handleSearchToggle = () => {
    setShowSearch((prev) => !prev);
    setSearchQuery("");
  };

  

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#fafaf7] pb-36 text-gray-950">
        {/* Header */}
        <header className="px-4 pt-12 pb-4 h-22.5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20 border-b border-gray-100">
          {/* LEFT */}
          {!showSearch ? (
            <button
              className="p-2 bg-gray-100 rounded-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon size={20} className="text-gray-700" />
            </button>
          ) : (
            <div className="w-2" />
          )}

          {/* CENTER */}
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.div
                key="search"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1 mx-3 bg-gray-100 rounded-xl flex items-center px-3 gap-2 overflow-hidden"
              >
                <Search size={15} className="text-gray-400 shrink-0" />

                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="flex-1 bg-transparent text-sm outline-none py-2 text-gray-700 placeholder:text-gray-400 min-w-28"
                />

                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="title"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 text-center leading-tight"
              >
                <h1 className="text-lg font-bold text-gray-800 leading-none">
                  Our Menu
                </h1>
                <p className="text-[10px] text-gray-400 leading-none">
                  What would you like to order?
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RIGHT */}
          <button
            className="p-2 bg-gray-100 rounded-xl"
            onClick={handleSearchToggle}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={showSearch ? "close" : "search"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {showSearch ? (
                  <X size={20} className="text-gray-700" />
                ) : (
                  <Search size={20} className="text-gray-700" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        </header>

        <section className="px-4 pt-4">
          <div
            className="relative overflow-hidden rounded-[2rem] bg-primary-900 p-5 text-white shadow-xl shadow-primary-900/10"
            style={restaurantInfo?.backgroundPhoto ? {
              backgroundImage: `linear-gradient(135deg, rgba(57,16,0,0.9), rgba(143,40,0,0.48)), url('${restaurantInfo.backgroundPhoto}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : undefined}
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/15 backdrop-blur">
                {restaurantInfo?.logo ? (
                  <img src={restaurantInfo.logo} alt={restaurantInfo?.name || "Restaurant"} className="h-full w-full object-cover" />
                ) : (
                  <ChefHat size={26} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black">{restaurantInfo?.name || "Restaurant menu"}</p>
                <p className="mt-1 text-xs font-semibold text-white/75">Choose a category and send your order directly to kitchen.</p>
              </div>
            </div>
          </div>
        </section>

        {insights?.pairs?.length > 0 && (
          <section className="px-4 pt-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">You may also like</p>
            <div className="mt-2 space-y-2 rounded-2xl border border-gray-100 bg-white p-3 text-xs text-gray-700 shadow-sm">
              {insights.pairs.slice(0, 2).map((p, i) => (
                <p key={i} className="font-semibold leading-snug">
                  {p.caption}
                </p>
              ))}
            </div>
          </section>
        )}

        {insights?.trending?.length > 0 && (
          <section className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Trending · social proof</p>
              {insights.daypart && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {insights.daypart}
                </span>
              )}
            </div>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
              {insights.trending.slice(0, 10).map((item) => (
                <Link
                  key={item._id}
                  to={`/item-detail/${slug}/${token}/${item._id}`}
                  className="w-28 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <img
                    src={
                      item.image ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=60"
                    }
                    alt=""
                    className="h-20 w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="line-clamp-2 text-[10px] font-bold text-gray-900">{item.name}</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-primary-600">
                      {item.orderCountToday || 0} today
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category list */}
        <div className="px-4 pt-4 space-y-3 pb-16">
          {filteredCategories.length === 0 ? (
            // Empty state when search returns nothing
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                No categories found
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching with a different keyword
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-xs text-orange-500 font-semibold border border-orange-300 px-4 py-1.5 rounded-full"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <Link
                to={`/item/${slug}/${token}/${cat.name}`}
                key={cat._id}
                className="group flex items-center p-3 bg-white rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all cursor-pointer hover:border-orange-200"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden mr-3 shrink-0">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800">{cat.name}</h3>
                  <p className="text-xs text-gray-400">{cat.description}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                  <ChevronRight size={18} />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Floating View Cart button */}
        <ViewCartBtn />

        <VoiceOrderFAB
          onTranscript={(text) => {
            setShowSearch(true);
            setSearchQuery(text.trim());
          }}
        />

        <Navigation />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </PageTransition>
  );
};

export default MenuCategories;
