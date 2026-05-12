import React, { useState, useEffect, useMemo } from "react";
import * as FramerMotion from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Plus,
  Minus,
  Heart,
  Star,
  Clock,
  Flame,
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../components/common/ToastContainer";
import { addItemToGuestCart, ensureGuestSession } from "../../../services/customer";
import Navigation from "../../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";

const ItemDetails = () => {
  const navigate = useNavigate();
  const { slug, token, id } = useParams();

  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState({});
  const [cookingInstructions, setCookingInstructions] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const { toasts, removeToast, success, error } = useToast();

  const [item, setItem] = useState({
    price: 0,
    description: "",
  });

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  useEffect(() => {
    const groups = item?.customizations;
    if (!groups?.length) {
      setSelections({});
      return;
    }
    const init = {};
    groups.forEach((c) => {
      if (c?.name && c?.options?.length) {
        init[c.name] = c.options[0];
      }
    });
    setSelections(init);
  }, [item._id]);

  const fetchItemDetails = async () => {
    try {
      const res = await api.get(
        `/restaurant/menu/items/${id}?restaurantSlug=${slug}`
      );

      setItem(res.data.data);
    } catch (err) {
      console.error(err);
      error("Failed to load item details");
    }
  };

  // Build the Nutritional Facts grid from whatever the admin actually saved.
  // Each gram-based macro is rendered as e.g. "18g"; the section is hidden
  // entirely when no values are present so we don't show empty placeholders.
  const nutritionalInfo = useMemo(() => {
    const n = item?.nutrition || {};
    const macros = [
      { key: "protein", label: "Protein", unit: "g" },
      { key: "carbs", label: "Carbs", unit: "g" },
      { key: "fat", label: "Fat", unit: "g" },
      { key: "fiber", label: "Fiber", unit: "g" },
    ];
    return macros
      .filter((m) => Number.isFinite(Number(n[m.key])))
      .map((m) => ({ label: m.label, value: `${Number(n[m.key])}${m.unit}` }));
  }, [item?.nutrition]);

  // Dynamic dietary chips driven by `dietaryTags` set in the admin panel.
  // Falls back to the legacy `isVegetarian` flag (or "Non-Veg") when no
  // tag has been picked yet.
  const TAG_BADGES = {
    veg:     { label: "Pure Veg",     border: "border-green-500",  fill: "bg-green-500",  text: "text-green-600" },
    egg:     { label: "Contains Egg", border: "border-amber-500",  fill: "bg-amber-500",  text: "text-amber-600" },
    chicken: { label: "Chicken",      border: "border-orange-500", fill: "bg-orange-500", text: "text-orange-600" },
    mutton:  { label: "Mutton",       border: "border-red-500",    fill: "bg-red-500",    text: "text-red-600" },
    buff:    { label: "Buff",         border: "border-rose-500",   fill: "bg-rose-500",   text: "text-rose-600" },
    pork:    { label: "Pork",         border: "border-pink-500",   fill: "bg-pink-500",   text: "text-pink-600" },
    fish:    { label: "Fish",         border: "border-blue-500",   fill: "bg-blue-500",   text: "text-blue-600" },
    seafood: { label: "Seafood",      border: "border-cyan-500",   fill: "bg-cyan-500",   text: "text-cyan-600" },
  };

  const dietaryBadges = useMemo(() => {
    const tags = Array.isArray(item?.dietaryTags) ? item.dietaryTags : [];
    if (tags.length > 0) {
      return tags
        .map((t) => TAG_BADGES[t])
        .filter(Boolean);
    }
    if (item?.isVegetarian) return [TAG_BADGES.veg];
    return [{ label: "Non-Veg", border: "border-red-500", fill: "bg-red-500", text: "text-red-600" }];
  }, [item?.dietaryTags, item?.isVegetarian]);

  const lineTotal = () => Number(item.price || 0) * quantity;

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = item?.name || "Menu item";
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out ${title} on the menu`,
          url,
        });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
          "_blank",
        );
      }
    } catch (err) {
      if (url) {
        await navigator.clipboard?.writeText?.(url);
        success("Link copied");
      }
    }
  };

  const handleAddToCart = async () => {
    try {
      const session = await ensureGuestSession(token);
      const customizations = Object.entries(selections).map(([name, value]) => ({
        name,
        value,
      }));
      const addOnLabels = customizations
        .filter((c) => /add|extra|topping/i.test(c.name))
        .map((c) => c.value);
      await addItemToGuestCart({
        guestId: session.guestId,
        qrToken: token,
        menuItemId: item._id,
        quantity,
        cookingInstructions: cookingInstructions.slice(0, 500),
        customizations,
        addOns: addOnLabels,
      });
      success(`${item.name} added to cart`);
    } catch (err) {
      console.error(err);
      error("Failed to add item to cart");
    }
  };

  // Description Logic
  const descriptionLines =
    item.description?.split("\n").filter(Boolean) || [];

  const visibleLines = showMore
    ? descriptionLines
    : descriptionLines.slice(0, 2);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-36">
      {/* Hero Image */}
      <div className="relative h-[45vh] w-full">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Top Buttons */}
        <div className="absolute top-12 left-4 right-4 flex justify-between">
          <FramerMotion.motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-3 bg-white/90 rounded-2xl shadow-lg"
          >
            <ArrowLeft size={22} />
          </FramerMotion.motion.button>

          <div className="flex gap-2">
            <FramerMotion.motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-3 rounded-2xl shadow-lg ${
                isFavorite
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-800"
              }`}
            >
              <Heart
                size={22}
                fill={isFavorite ? "white" : "none"}
              />
            </FramerMotion.motion.button>

            <FramerMotion.motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-3 bg-white/90 rounded-2xl shadow-lg"
            >
              <Share2 size={22} />
            </FramerMotion.motion.button>
          </div>
        </div>

        {/* Bestseller */}
        {(item.isBestseller || item.highlightTag === "trending") && (
          <div className="absolute bottom-12 left-6 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
            {item.highlightTag === "trending" ? "Trending" : "Bestseller"}
          </div>
        )}
        {item.highlightTag === "chef_special" && (
          <div className="absolute bottom-12 right-6 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
            Chef special
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 -mt-8 relative bg-white rounded-t-3xl pt-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {item.name}
            </h1>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {dietaryBadges.map((badge, idx) => (
                <div key={`${badge.label}-${idx}`} className="flex items-center gap-1">
                  <div
                    className={`w-4 h-4 border-2 ${badge.border} rounded-sm flex items-center justify-center`}
                  >
                    <div className={`w-2 h-2 ${badge.fill} rounded-sm`}></div>
                  </div>
                  <span className={`text-xs font-medium ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
              ))}

              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />

                <span className="text-xs font-semibold text-gray-700">
                  {item.rating || 4.5}
                </span>

                <span className="text-xs text-gray-400">
                  ({item.reviews || 0})
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-orange-600">
              Rs. {item.price}
            </p>

            {item.originalPrice && (
              <p className="text-sm text-gray-400 line-through">
                Rs. {item.originalPrice}
              </p>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {(item.preparationTime || item.prepTime) && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <Clock size={16} className="text-orange-500" />
              <span className="text-xs font-medium text-gray-600">
                {item.prepTime || `${item.preparationTime} min`}
              </span>
            </div>
          )}

          {Number.isFinite(Number(item?.nutrition?.calories)) && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <Flame size={16} className="text-orange-500" />
              <span className="text-xs font-medium text-gray-600">
                {Number(item.nutrition.calories)} kcal
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="font-bold text-gray-800">
            About this item
          </h3>

          <div className="mt-2 space-y-2">
            {visibleLines.map((line, index) => (
              <p
                key={index}
                className="text-gray-500 text-sm leading-relaxed"
              >
                • {line}
              </p>
            ))}
          </div>

          {descriptionLines.length > 2 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-3 flex items-center gap-1 text-orange-600 text-sm font-semibold"
            >
              {showMore ? (
                <>
                  See Less <ChevronUp size={16} />
                </>
              ) : (
                <>
                  See More <ChevronDown size={16} />
                </>
              )}
            </button>
          )}
        </div>

        {/* Nutritional Info — only shown when the admin has saved values */}
        {nutritionalInfo.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-800 mb-3">
              Nutritional Facts
            </h3>

            <div
              className={`grid gap-2 ${
                nutritionalInfo.length >= 4
                  ? "grid-cols-4"
                  : nutritionalInfo.length === 3
                  ? "grid-cols-3"
                  : nutritionalInfo.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {nutritionalInfo.map((nutrient, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-3 text-center"
                >
                  <p className="text-xs font-bold text-gray-800">
                    {nutrient.value}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {nutrient.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(item.customizations || []).length > 0 && (
          <div className="mt-8 space-y-5">
            <h3 className="font-bold text-gray-800">Customize</h3>
            {(item.customizations || []).map((group) => (
              <div key={group.name}>
                <p className="text-sm font-semibold text-gray-700 mb-2">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {(group.options || []).map((opt) => (
                    <button
                      type="button"
                      key={`${group.name}-${opt}`}
                      onClick={() =>
                        setSelections((prev) => ({ ...prev, [group.name]: opt }))
                      }
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        selections[group.name] === opt
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-2">Cooking instructions</h3>
          <textarea
            value={cookingInstructions}
            onChange={(e) => setCookingInstructions(e.target.value)}
            placeholder="e.g. No onion, less oil, allergy note…"
            className="w-full rounded-2xl border border-gray-200 p-3 text-sm min-h-[88px] outline-none focus:ring-2 focus:ring-orange-400"
            maxLength={500}
          />
        </div>

        {/* Quantity */}
        <div className="mt-8 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">
            Quantity
          </h3>

          <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() =>
                setQuantity(Math.max(1, quantity - 1))
              }
              className="p-2.5 bg-white rounded-xl"
            >
              <Minus size={18} />
            </button>

            <span className="font-bold w-8 text-center text-lg">
              {quantity}
            </span>

            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2.5 bg-white rounded-xl"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">
              Total
            </span>

            <span className="font-bold text-orange-600">
              Rs. {lineTotal()}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Button */}
      <div className="fixed bottom-[5.5rem] left-0 right-0 z-[85] border-t border-gray-100 bg-white/95 p-4 pb-5 backdrop-blur">
        <button
          onClick={handleAddToCart}
          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 shadow-lg shadow-primary-900/25"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>

            <div className="text-left">
              <span className="text-white font-bold block">
                Add to Cart
              </span>

              <span className="text-white/80 text-xs">
                {quantity} item
                {quantity > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <span className="text-white font-bold text-lg">
            Rs. {lineTotal()}
          </span>
        </button>
      </div>

      <Navigation />
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />
    </div>
  );
};

export default ItemDetails;