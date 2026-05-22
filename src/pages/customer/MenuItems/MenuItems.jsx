import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ArrowLeft,
  Plus,
  Minus,
  X,
  SlidersHorizontal,
  Sparkles,
  PackageOpen,
  UtensilsCrossed,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as FramerMotion from "framer-motion";

import Navigation from "../../../components/customer/Navigation";
import ViewCartBtn from "../../../components/customer/ViewCartBtn";
import CartDrawer from "../../../components/customer/CartDrawer";
import FilterSidebar from "../../../components/customer/menuItem/FilterSidebar";
import VoiceSearchButton from "../../../components/customer/VoiceSearchButton";
import api from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../components/common/ToastContainer";
import { useCustomerCart } from "../../../context/CustomerCartContext";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";

const TYPE_CHIPS = [
  { id: "all",     label: "All",     dot: "bg-gray-700",   active: "bg-gray-900 text-white border-gray-900" },
  { id: "veg",     label: "Veg",     dot: "bg-green-500",  active: "bg-green-500 text-white border-green-500" },
  { id: "egg",     label: "Egg",     dot: "bg-amber-400",  active: "bg-amber-500 text-white border-amber-500" },
  { id: "chicken", label: "Chicken", dot: "bg-orange-500", active: "bg-orange-500 text-white border-orange-500" },
  { id: "mutton",  label: "Mutton",  dot: "bg-red-500",    active: "bg-red-500 text-white border-red-500" },
  { id: "buff",    label: "Buff",    dot: "bg-rose-500",   active: "bg-rose-500 text-white border-rose-500" },
  { id: "pork",    label: "Pork",    dot: "bg-pink-500",   active: "bg-pink-500 text-white border-pink-500" },
  { id: "fish",    label: "Fish",    dot: "bg-blue-500",   active: "bg-blue-500 text-white border-blue-500" },
  { id: "seafood", label: "Seafood", dot: "bg-cyan-500",   active: "bg-cyan-500 text-white border-cyan-500" },
];

const getItemTags = (item) => {
  const tags = Array.isArray(item?.dietaryTags) ? item.dietaryTags.filter(Boolean) : [];
  if (tags.length > 0) return tags;
  if (item?.isVegetarian || item?.tag === "Veg") return ["veg"];
  if (item?.tag === "Non-Veg") return ["non-veg"];
  return [];
};

const isVegItem = (item) => {
  const tags = getItemTags(item);
  return tags.includes("veg") || item?.isVegetarian === true;
};

const hasRequiredVariationGroup = (item) =>
  (Array.isArray(item?.variationGroups) ? item.variationGroups : []).some((group) => {
    if (!group || group.isActive === false) return false;
    const minSelection = Number(group.minSelection ?? (group.isRequired ? 1 : 0));
    return group.isRequired || minSelection > 0;
  });

const needsOptionSelection = (item) =>
  hasRequiredVariationGroup(item) || (Array.isArray(item?.customizations) && item.customizations.length > 0);

const buildDefaultCustomizations = (item) =>
  (Array.isArray(item?.customizations) ? item.customizations : []).reduce((rows, group) => {
    if (group?.name && Array.isArray(group.options) && group.options.length > 0) {
      rows.push({ name: group.name, value: group.options[0] });
    }
    return rows;
  }, []);

const buildDefaultVariationPayload = (item) =>
  (Array.isArray(item?.variationGroups) ? item.variationGroups : []).flatMap((group) => {
    if (!group || group.isActive === false) return [];

    const availableOptions = (Array.isArray(group.options) ? group.options : []).filter(
      (option) => option && option.isAvailable !== false,
    );
    if (availableOptions.length === 0) return [];

    const minSelection = Math.max(0, Number(group.minSelection ?? (group.isRequired ? 1 : 0)));
    const defaultOptions = availableOptions.filter((option) => option.isDefault);

    if (group.selectionType === "multiple" || group.selectionType === "quantity") {
      const selected = [...defaultOptions];
      availableOptions.forEach((option) => {
        if (selected.length >= minSelection) return;
        if (!selected.some((row) => String(row._id) === String(option._id))) selected.push(option);
      });

      return selected.map((option) => ({
        groupId: group._id,
        optionId: option._id,
        quantity: Math.max(1, Number(option.minQuantity || 1)),
      }));
    }

    const option = defaultOptions[0] || (minSelection > 0 || group.isRequired ? availableOptions[0] : null);
    return option ? [{ groupId: group._id, optionId: option._id, quantity: 1 }] : [];
  });

const MenuItems = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    sort: "popular",
    priceRange: "all",
    dietary: "",
    type: "all",
  });

  const navigate = useNavigate();
  const { toasts, removeToast, success, error } = useToast();
  const { slug, token, category: categoryName } = useParams();
  const { hydrate, addItem, increment, decrement, quantityFor } = useCustomerCart();

  const decodedCategory = useMemo(
    () => (categoryName ? decodeURIComponent(categoryName) : ""),
    [categoryName],
  );

  useEffect(() => {
    if (slug && categoryName) fetchMenuItems();
  }, [slug, categoryName, token]);

  useEffect(() => {
    if (slug) fetchCategories();
  }, [slug, token]);

  useEffect(() => {
    if (slug && token) {
      rememberCustomerPortal(slug, token);
      hydrate(token);
    }
  }, [slug, token, hydrate]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ restaurantSlug: slug });
      if (token) qs.set("qrToken", token);
      const res = await api.get(
        `/restaurant/menu/items/by-category/${encodeURIComponent(categoryName)}?${qs.toString()}`,
      );
      const data = res.data.data;
      setFoodItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setFoodItems([]);
      error("Could not load menu items. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const qs = token ? `?qrToken=${encodeURIComponent(token)}` : "";
      const response = await api.get(`/restaurant/menu/public/${slug}${qs}`);
      setCategories(Array.isArray(response.data?.data?.menu) ? response.data.data.menu : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategorySelect = (name) => {
    if (!name || name === decodedCategory) return;
    setSearchQuery("");
    navigate(`/item/${slug}/${token}/${encodeURIComponent(name)}`);
  };

  const filteredItems = useMemo(() => {
    return foodItems.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const name = String(item?.name || "").toLowerCase();
      const description = String(item?.description || "").toLowerCase();
      const matchesName = !query || name.includes(query) || description.includes(query);

      let matchesPrice = true;
      const price = Number(item?.price || 0);
      switch (activeFilters.priceRange) {
        case "0-100":
          matchesPrice = price <= 100;
          break;
        case "100-200":
          matchesPrice = price >= 100 && price <= 200;
          break;
        case "200-500":
          matchesPrice = price >= 200 && price <= 500;
          break;
        case "500+":
          matchesPrice = price >= 500;
          break;
        default:
          matchesPrice = true;
      }
      const itemTags = getItemTags(item);
      const matchesDietary =
        !activeFilters.dietary ||
        (activeFilters.dietary === "vegetarian" && isVegItem(item)) ||
        (activeFilters.dietary === "vegan" && (item?.isVegan || isVegItem(item))) ||
        (activeFilters.dietary === "gluten-free" && item?.isGlutenFree) ||
        activeFilters.dietary === "nuts-free";

      const selectedType = activeFilters.type || "all";
      const matchesTagType =
        selectedType === "all" ||
        itemTags.includes(selectedType) ||
        (selectedType === "veg" && isVegItem(item));

      return matchesName && matchesPrice && matchesDietary && matchesTagType;
    });
  }, [foodItems, searchQuery, activeFilters]);

  const sortedItems = useMemo(() => {
    const next = [...filteredItems];
    switch (activeFilters.sort) {
      case "price-low":
        return next.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case "price-high":
        return next.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case "rating":
        return next.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      case "newest":
        return next.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      default:
        return next;
    }
  }, [filteredItems, activeFilters.sort]);

  const setTypeChip = (typeId) =>
    setActiveFilters((prev) => ({ ...prev, type: typeId || "all" }));

  const handleSearchToggle = () => {
    setShowSearch((prev) => !prev);
    setSearchQuery("");
  };

  const handleQuickAdd = async (item) => {
    try {
      const result = await addItem(item, {
        quantity: 1,
        customizations: buildDefaultCustomizations(item),
        selectedVariations: buildDefaultVariationPayload(item),
      });
      if (result) success(`${item.name} added to cart`);
    } catch (err) {
      error("Could not add item. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-50/60 pb-44">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-gray-100 bg-white/95 px-4 pb-4 pt-12 backdrop-blur-lg">
        <FramerMotion.motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition active:bg-gray-200"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </FramerMotion.motion.button>

        <FramerMotion.AnimatePresence mode="wait">
          {showSearch ? (
            <FramerMotion.motion.div
              key="search"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-1 origin-left items-center gap-2 overflow-hidden rounded-xl bg-gray-100 px-3"
            >
              <Search size={15} className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${decodedCategory || "items"}...`}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
              <VoiceSearchButton
                onTranscript={(text) => setSearchQuery(text.trim())}
                ariaLabel={`Voice search ${decodedCategory || "items"}`}
              />
            </FramerMotion.motion.div>
          ) : (
            <FramerMotion.motion.div
              key="title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex-1 text-center"
            >
              <h1 className="truncate text-base font-semibold tracking-tight text-gray-900">
                {decodedCategory || "Menu"}
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                {sortedItems.length} {sortedItems.length === 1 ? "dish" : "dishes"}
              </p>
            </FramerMotion.motion.div>
          )}
        </FramerMotion.AnimatePresence>

        <div className="flex items-center gap-2">
          <FramerMotion.motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setIsFilterOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700"
            aria-label="Filters"
          >
            <SlidersHorizontal size={18} />
            {(activeFilters.sort !== "popular" ||
              activeFilters.priceRange !== "all" ||
              activeFilters.dietary !== "" ||
              (activeFilters.type && activeFilters.type !== "all")) && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white" />
            )}
          </FramerMotion.motion.button>
          <FramerMotion.motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSearchToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700"
            aria-label={showSearch ? "Close search" : "Search"}
          >
            <FramerMotion.AnimatePresence mode="wait">
              <FramerMotion.motion.div
                key={showSearch ? "close" : "search"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {showSearch ? <X size={18} /> : <Search size={18} />}
              </FramerMotion.motion.div>
            </FramerMotion.AnimatePresence>
          </FramerMotion.motion.button>
        </div>
      </header>

      <div className="sticky top-[89px] z-10 border-b border-gray-100 bg-surface-50/95 pb-3 shadow-sm backdrop-blur-lg">
        <CategoryCircleStrip
          categories={categories}
          activeCategory={decodedCategory}
          loading={categoriesLoading}
          onSelect={handleCategorySelect}
        />

        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TYPE_CHIPS.map((chip) => {
              const active = (activeFilters.type || "all") === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setTypeChip(chip.id)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    active
                      ? `${chip.active} shadow-sm`
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {chip.id !== "all" && (
                    <span className={`h-2 w-2 rounded-full ${active ? "bg-white/90" : chip.dot}`} />
                  )}
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pt-4 pb-40">
        {loading ? (
          <SkeletonList />
        ) : sortedItems.length === 0 ? (
          <EmptyState
            isSearching={Boolean(searchQuery)}
            onClearSearch={() => setSearchQuery("")}
            onClearFilters={() => {
              setActiveFilters({ sort: "popular", priceRange: "all", dietary: "", type: "all" });
            }}
          />
        ) : (
          <FramerMotion.motion.ul
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {sortedItems.map((item) => {
              const qty = quantityFor(item._id);
              return (
                <FramerMotion.motion.li
                  key={item._id}
                  variants={cardVariants}
                  layout
                  className="group flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all hover:shadow-md"
                >
                  <Link
                    to={`/item-detail/${slug}/${token}/${item._id}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <PackageOpen size={26} />
                      </div>
                    )}
                    <div
                      className={`absolute left-2 top-2 flex h-3 w-3 items-center justify-center rounded-sm border-2 bg-white ${
                        item.tag === "Veg" ? "border-emerald-500" : "border-red-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.tag === "Veg" ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                    {(item.isBestseller || item.highlightTag === "trending") && (
                      <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-md bg-attention-300/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-900 shadow-sm">
                        <Sparkles size={9} />
                        Hot
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between py-0.5">
                    <Link
                      to={`/item-detail/${slug}/${token}/${item._id}`}
                      className="block"
                    >
                      <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                        {item.description}
                      </p>
                    </Link>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <span className="text-base font-semibold text-gray-900">
                          Rs. {item.price}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="ml-1.5 text-[10px] font-semibold text-gray-400 line-through">
                            Rs. {item.originalPrice}
                          </span>
                        )}
                      </div>

                      <CardQuantityControl
                        quantity={qty}
                        onAdd={() => handleQuickAdd(item)}
                        onPlus={() => increment(item._id)}
                        onMinus={() => decrement(item._id)}
                        hasCustomizations={needsOptionSelection(item)}
                      />
                    </div>
                  </div>
                </FramerMotion.motion.li>
              );
            })}
          </FramerMotion.motion.ul>
        )}
      </div>

      <ViewCartBtn hidden={isFilterOpen} />
      <Navigation hidden={isFilterOpen} />
      <CartDrawer />

      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => setActiveFilters(filters)}
        currentFilters={activeFilters}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
};

function CategoryCircleStrip({ categories, activeCategory, loading, onSelect }) {
  if (loading) {
    return (
      <div className="bg-white px-4 py-3">
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex w-16 shrink-0 flex-col items-center gap-2">
              <div className="h-14 w-14 animate-pulse rounded-full bg-gray-100" />
              <div className="h-2 w-12 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories.length) return null;

  return (
    <div className="bg-white px-4 py-3">
      <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const isActive = category?.name === activeCategory;
          const image = category?.image || category?.coverImage || category?.items?.find((item) => item?.image)?.image;
          return (
            <button
              key={category._id || category.name}
              type="button"
              onClick={() => onSelect(category.name)}
              aria-pressed={isActive}
              className="group flex w-16 shrink-0 flex-col items-center gap-2"
            >
              <span
                className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition-all ${
                  isActive
                    ? "border-primary-600 bg-primary-50 shadow-md shadow-primary-900/10"
                    : "border-gray-100 bg-gray-50 group-active:scale-95"
                }`}
              >
                {image ? (
                  <img
                    src={image}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed
                    size={22}
                    className={isActive ? "text-primary-700" : "text-gray-400"}
                  />
                )}
              </span>
              <span
                className={`line-clamp-2 min-h-[28px] text-center text-[10px] font-semibold leading-tight ${
                  isActive ? "text-primary-700" : "text-gray-500"
                }`}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardQuantityControl({
  quantity,
  onAdd,
  onPlus,
  onMinus,
  hasCustomizations,
}) {
  if (hasCustomizations && quantity === 0) {
    return (
      <FramerMotion.motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onAdd}
        className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 transition active:from-emerald-600"
        aria-label="Add to cart"
      >
        <Plus size={14} strokeWidth={3} />
        Add
      </FramerMotion.motion.button>
    );
  }

  return (
    <FramerMotion.AnimatePresence mode="wait" initial={false}>
      {quantity === 0 ? (
        <FramerMotion.motion.button
          key="add"
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          onClick={onAdd}
          className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 transition active:from-emerald-600"
          aria-label="Add to cart"
        >
          <Plus size={14} strokeWidth={3} />
          Add
        </FramerMotion.motion.button>
      ) : (
        <FramerMotion.motion.div
          key="stepper"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="flex items-center gap-1.5 rounded-xl border border-primary-100 bg-primary-50/80 px-1.5 py-1"
        >
          <button
            type="button"
            onClick={onMinus}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm transition active:scale-90"
            aria-label="Decrease"
          >
            <Minus size={13} strokeWidth={3} />
          </button>
          <FramerMotion.motion.span
            key={quantity}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className="w-5 text-center text-xs font-semibold tabular-nums text-primary-800"
          >
            {quantity}
          </FramerMotion.motion.span>
          <button
            type="button"
            onClick={onPlus}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm transition active:scale-90"
            aria-label="Increase"
          >
            <Plus size={13} strokeWidth={3} />
          </button>
        </FramerMotion.motion.div>
      )}
    </FramerMotion.AnimatePresence>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex animate-pulse gap-3 rounded-2xl border border-gray-100 bg-white p-3"
        >
          <div className="h-24 w-24 shrink-0 rounded-2xl bg-gray-100" />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-3 w-2/3 rounded-full bg-gray-100" />
            <div className="h-2 w-full rounded-full bg-gray-100" />
            <div className="h-2 w-4/6 rounded-full bg-gray-100" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-4 w-16 rounded-md bg-gray-100" />
              <div className="h-7 w-16 rounded-xl bg-gray-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ isSearching, onClearSearch, onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <Search size={24} className="text-gray-300" />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-700">
        {isSearching ? "No items found" : "Choose different filters"}
      </p>
      <p className="mt-1 text-xs font-semibold text-gray-400">
        {isSearching
          ? "Try searching with a different keyword"
          : "No items match your current filters"}
      </p>
      <button
        onClick={isSearching ? onClearSearch : onClearFilters}
        className="mt-4 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-[11px] font-semibold text-primary-700"
      >
        {isSearching ? "Clear search" : "Clear filters"}
      </button>
    </div>
  );
}

export default MenuItems;
