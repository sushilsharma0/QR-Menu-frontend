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
  });
  const navigate = useNavigate();
  const { toasts, removeToast, success, error, warning } = useToast();

  const { slug, token, category: categoryName } = useParams();
  
  useEffect(() => {
    if (slug && categoryName) {
      fetchMenuItems();
    }
  }, [slug, categoryName]);

  const fetchMenuItems = async () => {
    try {
      // Call the by-category endpoint with slug as query param
      const res = await api.get(`/restaurant/menu/items/by-category/${categoryName}?restaurantSlug=${slug}`);
    

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
    // ✅ ADD THIS ABOVE return
    const matchesDietary =
      !activeFilters.dietary ||
      (activeFilters.dietary === "vegetarian" && item.tag === "Veg") ||
      (activeFilters.dietary === "vegan" && item.tag === "Veg");

    // ✅ UPDATE return
    return matchesName && matchesType && matchesPrice && matchesDietary;
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
      const restaurantRes = await api.get(`/restaurant/menu/public/${slug}`);
      const restaurant = restaurantRes.data.data;

      const cartItem = {
        _id: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        restaurantId: restaurant._id,
        addons: [],
      };

      let cart = JSON.parse(localStorage.getItem("cart")) || {
        items: [],
        total: 0,
        restaurantId: null,
      };

      if (cart.restaurantId && cart.restaurantId !== restaurant._id) {
        warning("Added items from a different restaurant will clear your cart");
        cart = { items: [], total: 0, restaurantId: null };
      }

      const existingItemIndex = cart.items.findIndex((i) => i._id === item._id);

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += 1;
        success(`${item.name} quantity updated!`);
      } else {
        cart.items.push(cartItem);
        success(`${item.name} added to cart!`);
      }

      cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      cart.restaurantId = restaurant._id;

      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error adding to cart:", err);
      error("Failed to add item. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32">
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
              activeFilters.dietary !== "") && (
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
              <Link to={`/item-detail/${JSON.parse(localStorage.getItem("user")).slug}/${token}/${item._id}`} className="relative w-24 h-24 shrink-0">
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
                <Link to={`/item-detail/${JSON.parse(localStorage.getItem("user")).slug}/${token}/${item._id}`}>
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
