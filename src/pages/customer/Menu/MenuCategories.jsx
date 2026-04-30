import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  ShoppingBag,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../../../components/customer/Navigation";
import PageTransition from "../../../components/customer/PageTransition";
import Sidebar from "../../../components/customer/homepage/SideBar";
import ViewCartBtn from "../../../components/customer/ViewCartBtn";
import api from "../../../services/api";

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

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const categoriesRes = await api.get("/restaurant/menu/categories");
      setCategories(categoriesRes.data.data);
      console.log(categoriesRes.data.data);
    } catch (error) {
      // toast.error("Failed to fetch menu data");
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-white pb-32">
        {/* Header */}
        <header className="px-4 pt-12 pb-4 h-22.5 flex items-center justify-between sticky top-0 bg-white">
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

        {/* Category list */}
        <div className="px-4 pt-2.5 space-y-3 pb-16">
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
                to="/menuItems"
                key={cat._id}
                className="group flex items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all cursor-pointer hover:border-orange-200"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden mr-3 shrink-0">
                  <img
                    src={cat.imageUrl || "https://via.placeholder.com/150?text=No+Image"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800">{cat.name}</h3>
                  <p className="text-xs text-gray-400">{cat.count} Items</p>
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
