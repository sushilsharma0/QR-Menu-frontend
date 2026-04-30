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
};

const FilterSidebar = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState({
    sort: currentFilters?.sort || "popular",
    priceRange: currentFilters?.priceRange || "all",
    dietary: currentFilters?.dietary || "",
  });

  // Reset filters when sidebar opens with currentFilters
  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters({
        sort: currentFilters.sort || "popular",
        priceRange: currentFilters.priceRange || "all",
        dietary: currentFilters.dietary || "",
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

  const handleClear = () => {
    const resetFilters = {
      sort: "popular",
      priceRange: "all",
      dietary: "",
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