import React, { useState, useEffect } from "react";
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

  const nutritionalInfo = [
    { label: "Protein", value: "18g" },
    { label: "Carbs", value: "52g" },
    { label: "Fat", value: "16g" },
    { label: "Fiber", value: "3g" },
  ];

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

  return (
    <div className="min-h-screen bg-white pb-32">
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

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-green-500 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-1.5 bg-green-500 rounded-sm"></div>
                </div>

                <span className="text-xs font-medium text-green-600">
                  Pure Veg
                </span>
              </div>

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
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
            <Clock size={16} className="text-orange-500" />

            <span className="text-xs font-medium text-gray-600">
              {item.prepTime || "20-25 min"}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
            <Flame size={16} className="text-orange-500" />

            <span className="text-xs font-medium text-gray-600">
              {item.calories || 420} kcal
            </span>
          </div>
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

        {/* Nutritional Info */}
        <div className="mt-6">
          <h3 className="font-bold text-gray-800 mb-3">
            Nutritional Facts
          </h3>

          <div className="grid grid-cols-4 gap-2">
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
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white border-t z-50">
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 py-4 rounded-2xl flex items-center justify-between px-6 shadow-lg"
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

      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />
    </div>
  );
};

export default ItemDetails;