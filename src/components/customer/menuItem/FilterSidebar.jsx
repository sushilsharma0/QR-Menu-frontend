import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";

const filterOptions = {
  sort: [
    { id: "popular", label: "Popular" },
    { id: "newest", label: "Newest" },
    { id: "rating", label: "Rating" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
  ],
  priceRange: [
    { id: "all", label: "All Prices" },
    { id: "0-100", label: "Under ₹100" },
    { id: "100-200", label: "₹100 - ₹200" },
    { id: "200-500", label: "₹200 - ₹500" },
    { id: "500+", label: "₹500+" },
  ],
  dietary: [
    { id: "vegan", label: "Vegan" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "gluten-free", label: "Gluten Free" },
    { id: "nuts-free", label: "Nuts Free" },
  ],
  /**
   * Cuisine / meat tags chosen by the restaurant admin per menu item.
   * Single-select — clicking "Mutton" hides everything else, "All" resets.
   */
  types: [
    { id: "all", label: "All", dotClass: "bg-gray-700", activeClass: "bg-gray-900 text-white border-gray-900" },
    { id: "veg", label: "Veg", dotClass: "bg-green-500", activeClass: "bg-green-500 text-white border-green-500" },
    { id: "egg", label: "Egg", dotClass: "bg-amber-400", activeClass: "bg-amber-500 text-white border-amber-500" },
    { id: "chicken", label: "Chicken", dotClass: "bg-orange-500", activeClass: "bg-orange-500 text-white border-orange-500" },
    { id: "mutton", label: "Mutton", dotClass: "bg-red-500", activeClass: "bg-red-500 text-white border-red-500" },
    { id: "buff", label: "Buff", dotClass: "bg-rose-500", activeClass: "bg-rose-500 text-white border-rose-500" },
    { id: "pork", label: "Pork", dotClass: "bg-pink-500", activeClass: "bg-pink-500 text-white border-pink-500" },
    { id: "fish", label: "Fish", dotClass: "bg-blue-500", activeClass: "bg-blue-500 text-white border-blue-500" },
    { id: "seafood", label: "Seafood", dotClass: "bg-cyan-500", activeClass: "bg-cyan-500 text-white border-cyan-500" },
  ],
};

const FilterSidebar = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState({
    sort: currentFilters?.sort || "popular",
    priceRange: currentFilters?.priceRange || "all",
    dietary: currentFilters?.dietary || "",
    type: currentFilters?.type || "all",
  });

  // Reset filters when sidebar opens with currentFilters
  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters({
        sort: currentFilters.sort || "popular",
        priceRange: currentFilters.priceRange || "all",
        dietary: currentFilters.dietary || "",
        type: currentFilters.type || "all",
      });
    }
  }, [isOpen, currentFilters]);

   useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

  const handleSortChange = (sortId) => {
    setFilters((prev) => ({ ...prev, sort: sortId }));
  };

  const handlePriceChange = (priceId) => {
    setFilters((prev) => ({ ...prev, priceRange: priceId }));
  };

  const handleDietaryChange = (dietaryId) => {
    // Single selection - if clicking same option, deselect it
    setFilters((prev) => ({
      ...prev,
      dietary: prev.dietary === dietaryId ? "" : dietaryId,
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleTypeSelect = (typeId) => {
    setFilters((prev) => ({ ...prev, type: typeId || "all" }));
  };

  const handleClear = () => {
    const resetFilters = {
      sort: "popular",
      priceRange: "all",
      dietary: "",
      type: "all",
    };
    setFilters(resetFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sidebar - Half Screen */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full max-w-sm bg-white z-50 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Filters</h2>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Sort By
                </h3>
                <div className="space-y-2">
                  {filterOptions.sort.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSortChange(option.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                        filters.sort === option.id
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                      {filters.sort === option.id && (
                        <Check size={16} className="text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Price Range
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.priceRange.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handlePriceChange(option.id)}
                      className={`px-4 py-3 rounded-xl text-sm transition-all ${
                        filters.priceRange === option.id
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type (cuisine/meat tags set by restaurant admin) — single-select */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Type
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.types.map((option) => {
                    const active = (filters.type || "all") === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleTypeSelect(option.id)}
                        aria-pressed={active}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all ${
                          active
                            ? `${option.activeClass} shadow-sm`
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                        }`}
                      >
                        {option.id !== "all" && (
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              active ? "bg-white/90" : option.dotClass
                            }`}
                          />
                        )}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Dietary Preferences
                </h3>
                <div className="space-y-2">
                  {filterOptions.dietary.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleDietaryChange(option.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                        filters.dietary === option.id
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                      {filters.dietary === option.id && (
                        <Check size={16} className="text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-3">
              <button
                onClick={handleApply}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClear}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
              >
                Clear All
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterSidebar;