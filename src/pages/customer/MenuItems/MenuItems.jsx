import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowLeft,
  ShoppingBag,
  Plus,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import * as FramerMotion from "framer-motion";
import Navigation from "../../../components/customer/Navigation";
import ViewCartBtn from "../../../components/customer/ViewCartBtn";
import FilterSidebar from "../../../components/customer/menuItem/FilterSidebar";
import api from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../components/common/ToastContainer";
import { addItemToGuestCart, ensureGuestSession } from "../../../services/customer";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";



const TYPE_CHIPS = [
  { id: "all", label: "All", dot: "bg-gray-700", active: "bg-gray-900 text-white border-gray-900" },
  { id: "veg", label: "Veg", dot: "bg-green-500", active: "bg-green-500 text-white border-green-500" },
  { id: "egg", label: "Egg", dot: "bg-amber-400", active: "bg-amber-500 text-white border-amber-500" },
  { id: "chicken", label: "Chicken", dot: "bg-orange-500", active: "bg-orange-500 text-white border-orange-500" },
  { id: "mutton", label: "Mutton", dot: "bg-red-500", active: "bg-red-500 text-white border-red-500" },
  { id: "buff", label: "Buff", dot: "bg-rose-500", active: "bg-rose-500 text-white border-rose-500" },
  { id: "pork", label: "Pork", dot: "bg-pink-500", active: "bg-pink-500 text-white border-pink-500" },
  { id: "fish", label: "Fish", dot: "bg-blue-500", active: "bg-blue-500 text-white border-blue-500" },
  { id: "seafood", label: "Seafood", dot: "bg-cyan-500", active: "bg-cyan-500 text-white border-cyan-500" },
];

const MenuItems = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [foodType, setFoodType] = useState("all"); // 'all', 'veg', or 'non-veg'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [addedItemName, setAddedItemName] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    sort: "popular",
    priceRange: "all",
    dietary: "",
    type: "all",
  });

  const setTypeChip = (typeId) => {
    setActiveFilters((prev) => ({ ...prev, type: typeId || "all" }));
  };
  const navigate = useNavigate();
  const { toasts, removeToast, success, error } = useToast();

  const { slug, token, category: categoryName } = useParams();
  
  useEffect(() => {
    if (slug && categoryName) {
      fetchMenuItems();
    }
  }, [slug, categoryName, token]);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  const fetchMenuItems = async () => {
    try {
      // Call the by-category endpoint with slug as query param
      const qs = new URLSearchParams({ restaurantSlug: slug });
      if (token) qs.set('qrToken', token);
      const res = await api.get(`/restaurant/menu/items/by-category/${encodeURIComponent(categoryName)}?${qs.toString()}`);
    

      // Handle the response - items are in res.data.data.items
      const data = res.data.data;
      if (data && data.items) {
        setFoodItems(data.items);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // Filter items by search query, food type, and price range
  const filteredItems = foodItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().startsWith(query);

    const matchesType =
      foodType === "all" ||
      (foodType === "veg" && item.tag === "Veg") ||
      (foodType === "non-veg" && item.tag === "Non-Veg");

    // Price range filter
    // ✅ FIXED Price range filter
    let matchesPrice = true;

    switch (activeFilters.priceRange) {
      case "0-100":
        matchesPrice = item.price <= 100;
        break;
      case "100-200":
        matchesPrice = item.price >= 100 && item.price <= 200;
        break;
      case "200-500":
        matchesPrice = item.price >= 200 && item.price <= 500;
        break;
      case "500+":
        matchesPrice = item.price >= 500;
        break;
      default:
        matchesPrice = true;
    }
    const matchesDietary =
      !activeFilters.dietary ||
      (activeFilters.dietary === "vegetarian" && item.tag === "Veg") ||
      (activeFilters.dietary === "vegan" && item.tag === "Veg");

    // Match against the admin-set dietaryTags (veg / chicken / mutton / buff…).
    // Tab-style single-select: "all" disables the filter, any other value must
    // appear in the item's dietaryTags array.
    const selectedType = activeFilters.type || "all";
    const itemTags = Array.isArray(item.dietaryTags) ? item.dietaryTags : [];
    const matchesType2 = selectedType === "all" || itemTags.includes(selectedType);

    return matchesName && matchesType && matchesPrice && matchesDietary && matchesType2;
  });

  // Sort items based on active sort filter
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (activeFilters.sort) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return b.id - a.id; // Assuming higher ID = newer
      case "rating":
        return 0; // Add rating field to implement
      case "popular":
      default:
        return 0;
    }
  });

  const handleSearchToggle = () => {
    setShowSearch((prev) => !prev);
    setSearchQuery("");
  };

  const handleAddToCart = async (item) => {
    try {
      const session = await ensureGuestSession(token);
      await addItemToGuestCart({
        guestId: session.guestId,
        qrToken: token,
        menuItemId: item._id,
        quantity: 1,
      });
      success(`${item.name} added to cart!`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      error("Failed to add item. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-36">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 mb-4 flex items-center justify-between bg-white sticky top-0 z-10">
        {/* LEFT (Back Button) */}
        <FramerMotion.motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-xl"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </FramerMotion.motion.button>

        {/* CENTER (Title / Search) */}
        <FramerMotion.AnimatePresence mode="wait">
          {showSearch ? (
            <FramerMotion.motion.div
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
                placeholder="Search items..."
                className="flex-1 bg-transparent text-sm outline-none py-2 text-gray-700 placeholder:text-gray-400 min-w-20"
              />

              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </FramerMotion.motion.div>
          ) : (
            <FramerMotion.motion.div
              key="title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 text-center"
            >
              <h1 className="text-lg font-bold text-gray-800">Starters</h1>
            </FramerMotion.motion.div>
          )}
        </FramerMotion.AnimatePresence>

        {/* RIGHT (Search Toggle & Filter) */}
        <div className="flex items-center gap-2">
          <FramerMotion.motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setIsFilterOpen(true)}
            className="p-2 bg-gray-100 rounded-xl relative"
          >
            <SlidersHorizontal size={20} className="text-gray-700" />
            {(activeFilters.sort !== "popular" ||
              activeFilters.priceRange !== "all" ||
              activeFilters.dietary !== "" ||
              (activeFilters.type && activeFilters.type !== "all")) && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
            )}
          </FramerMotion.motion.button>
          <FramerMotion.motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSearchToggle}
            className="p-2 bg-gray-100 rounded-xl"
          >
            <FramerMotion.AnimatePresence mode="wait">
              <FramerMotion.motion.div
                key={showSearch ? "close" : "search"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {showSearch ? (
                  <X size={20} className="text-gray-700" />
                ) : (
                  <Search size={20} className="text-gray-700" />
                )}
              </FramerMotion.motion.div>
            </FramerMotion.AnimatePresence>
          </FramerMotion.motion.button>
        </div>
      </header>

      {/* Food Type Toggle */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-center bg-gray-100 rounded-full p-1 gap-5">
          <button
            onClick={() => setFoodType("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              foodType === "all"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFoodType("veg")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
              foodType === "veg"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Veg
          </button>
          <button
            onClick={() => setFoodType("non-veg")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
              foodType === "non-veg"
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Non-Veg
          </button>
        </div>
      </div>

      {/* Type chips (admin-set tags: All / Veg / Chicken / Mutton / Buff…) */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPE_CHIPS.map((chip) => {
            const active = (activeFilters.type || "all") === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setTypeChip(chip.id)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? `${chip.active} shadow-sm scale-[1.03]`
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {chip.id !== "all" && (
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      active ? "bg-white/90" : chip.dot
                    }`}
                  />
                )}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="px-6 mt-4 mb-7 space-y-6">
        {sortedItems.length === 0 ? (
          // Empty state - different messages for search vs filter
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Search size={24} className="text-gray-300" />
            </div>
            {searchQuery ? (
              <>
                <p className="text-sm font-semibold text-gray-600">
                  No items found
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
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-600">
                  Choose different filters
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  No items match your current filters
                </p>
                <button
                  onClick={() => {
                    setActiveFilters({
                      sort: "popular",
                      priceRange: "all",
                      dietary: "",
                      type: "all",
                    });
                    setFoodType("all");
                  }}
                  className="mt-4 text-xs text-orange-500 font-semibold border border-orange-300 px-4 py-1.5 rounded-full"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item._id} className="flex gap-4 group bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
              {/* Item image with veg/non-veg indicator */}
              <Link to={`/item-detail/${slug}/${token}/${item._id}`} className="relative w-24 h-24 shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
                {/* Veg / non-veg dot badge */}
                <div
                  className={`absolute top-2 left-2 w-3 h-3 border-2 rounded-sm flex items-center justify-center bg-white ${
                    item.tag === "Veg" ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.tag === "Veg" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </Link>

              {/* Item details */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <Link to={`/item-detail/${slug}/${token}/${item._id}`}>
                  <h3 className="font-bold text-gray-800 text-base">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-gray-900">
                    Rs. {item.price}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg shadow-md transition-transform active:scale-90"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating View Cart Footer */}
      <ViewCartBtn />

      <Navigation />

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => setActiveFilters(filters)}
        currentFilters={activeFilters}
      />

      <FramerMotion.AnimatePresence>
        {showAddedToast && (
          <FramerMotion.motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50"
          >
            <ShoppingBag size={16} />
            <span className="font-semibold text-sm">
              {addedItemName || "Item"} added to cart
            </span>
          </FramerMotion.motion.div>
        )}
      </FramerMotion.AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default MenuItems;
