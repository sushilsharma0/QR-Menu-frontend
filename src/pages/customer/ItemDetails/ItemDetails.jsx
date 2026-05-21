import React, { useReducer, useEffect, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../components/common/ToastContainer";
import Navigation from "../../../components/customer/Navigation";
import CartDrawer from "../../../components/customer/CartDrawer";
import { useCustomerCart } from "../../../context/CustomerCartContext";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";

const initialItem = {
  price: 0,
  description: "",
};

const initialState = {
  item: initialItem,
  quantity: 1,
  selections: {},
  variationSelections: {},
  cookingInstructions: "",
  isFavorite: false,
  showMore: false,
  isAdding: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "setItem":
      return { ...state, item: action.item };
    case "setQuantity":
      return {
        ...state,
        quantity: typeof action.value === "function" ? action.value(state.quantity) : action.value,
      };
    case "setSelections":
      return {
        ...state,
        selections: typeof action.value === "function" ? action.value(state.selections) : action.value,
      };
    case "setVariationSelections":
      return {
        ...state,
        variationSelections:
          typeof action.value === "function" ? action.value(state.variationSelections) : action.value,
      };
    case "setCookingInstructions":
      return { ...state, cookingInstructions: action.value };
    case "setIsFavorite":
      return { ...state, isFavorite: action.value };
    case "setShowMore":
      return { ...state, showMore: action.value };
    case "setIsAdding":
      return { ...state, isAdding: action.value };
    default:
      return state;
  }
};

const ItemHero = ({ item, isFavorite, onBack, onFavoriteToggle, onShare }) => (
  <div className="relative h-[45vh] w-full">
    <img
      src={item.image}
      alt={item.name}
      className="w-full h-full object-cover"
    />

    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

    <div className="absolute top-12 left-4 right-4 flex justify-between">
      <FramerMotion.motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="p-3 bg-white/90 rounded-2xl shadow-lg"
      >
        <ArrowLeft size={22} />
      </FramerMotion.motion.button>

      <div className="flex gap-2">
        <FramerMotion.motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onFavoriteToggle}
          className={`p-3 rounded-2xl shadow-lg ${
            isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-800"
          }`}
        >
          <Heart size={22} fill={isFavorite ? "white" : "none"} />
        </FramerMotion.motion.button>

        <FramerMotion.motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onShare}
          className="p-3 bg-white/90 rounded-2xl shadow-lg"
        >
          <Share2 size={22} />
        </FramerMotion.motion.button>
      </div>
    </div>

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
);

const ItemSummary = ({ item, dietaryBadges, liveUnitPrice }) => (
  <>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          {item.name}
        </h1>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {dietaryBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-1">
              <div className={`w-4 h-4 border-2 ${badge.border} rounded-sm flex items-center justify-center`}>
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
          Rs. {liveUnitPrice}
        </p>

        {item.originalPrice && (
          <p className="text-sm text-gray-400 line-through">
            Rs. {item.originalPrice}
          </p>
        )}
      </div>
    </div>

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
  </>
);

const DescriptionSection = ({ visibleLines, descriptionLines, showMore, onToggle }) => (
  <div className="mt-6">
    <h3 className="font-semibold text-gray-800">
      About this item
    </h3>

    <div className="mt-2 space-y-2">
      {visibleLines.map((line) => (
        <p key={line} className="text-gray-500 text-sm leading-relaxed">
          Ã¢â‚¬Â¢ {line}
        </p>
      ))}
    </div>

    {descriptionLines.length > 2 && (
      <button
        onClick={onToggle}
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
);

const NutritionSection = ({ nutritionalInfo }) => {
  if (nutritionalInfo.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-800 mb-3">
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
        {nutritionalInfo.map((nutrient) => (
          <div key={nutrient.label} className="bg-gray-50 rounded-xl p-3 text-center">
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
  );
};

const VariationGroupsSection = ({
  activeVariationGroups,
  variationSelections,
  setSingleVariation,
  toggleMultiVariation,
  setVariationQuantity,
}) => {
  if (activeVariationGroups.length === 0) return null;

  return (
    <div className="mt-8 space-y-5">
      {activeVariationGroups.map((group) => {
        const selectedRows = variationSelections[group._id] || [];
        const display = group.displayType || (group.selectionType === "multiple" ? "checkbox" : "chips");
        return (
          <div key={group._id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-gray-900">{group.name}</p>
                <p className="text-[11px] font-bold text-gray-400">
                  {group.isRequired ? "Required" : "Optional"}
                  {group.maxSelection > 1 ? ` | choose up to ${group.maxSelection}` : ""}
                </p>
              </div>
            </div>

            {display === "dropdown" ? (
              <select
                value={selectedRows[0]?.optionId || ""}
                onChange={(e) => setSingleVariation(group._id, e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-300"
              >
                {!group.isRequired && <option value="">No selection</option>}
                {(group.options || []).map((option) => (
                  <option key={option._id} value={option._id} disabled={option.isAvailable === false || (option.trackInventory && Number(option.stockQuantity || 0) <= 0)}>
                    {option.name} {Number(option.additionalPrice || 0) > 0 ? `(+Rs. ${option.additionalPrice})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className={display === "cards" || display === "image" ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
                {(group.options || []).map((option) => {
                  const selected = selectedRows.some((row) => String(row.optionId) === String(option._id));
                  const row = selectedRows.find((r) => String(r.optionId) === String(option._id));
                  const outOfStock = option.trackInventory && Number(option.stockQuantity || 0) <= 0;
                  const unavailable = option.isAvailable === false || outOfStock;
                  const price = Number(option.discountedPrice ?? option.additionalPrice ?? 0);
                  if (group.selectionType === "quantity" || display === "stepper") {
                    const qty = Number(row?.quantity || 0);
                    return (
                      <div key={option._id} className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 ${qty > 0 ? "border-orange-400" : "border-gray-200"} ${unavailable ? "opacity-50" : ""}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-800">{option.name}</p>
                          <p className="text-[10px] font-bold text-gray-400">
                            {price > 0 ? `+Rs. ${price}` : "Included"}{outOfStock ? " | out of stock" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" disabled={unavailable || qty <= 0} onClick={() => setVariationQuantity(group, option, qty - 1)} className="h-8 w-8 rounded-lg bg-gray-100 font-black">-</button>
                          <span className="w-5 text-center text-sm font-black">{qty}</span>
                          <button type="button" disabled={unavailable} onClick={() => setVariationQuantity(group, option, qty + 1)} className="h-8 w-8 rounded-lg bg-orange-600 font-black text-white">+</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button
                      type="button"
                      key={option._id}
                      disabled={unavailable}
                      onClick={() =>
                        group.selectionType === "multiple"
                          ? toggleMultiVariation(group, option._id)
                          : setSingleVariation(group._id, option._id)
                      }
                      className={`${display === "cards" || display === "image" ? "min-h-[86px] text-left" : ""} rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        selected
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-700"
                      } ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {display === "image" && option.image ? (
                        <img src={option.image} alt={option.name} className="mb-2 h-16 w-full rounded-lg object-cover" />
                      ) : null}
                      <span className="block">{option.name}</span>
                      <span className="mt-0.5 block text-[10px] text-gray-400">
                        {price > 0 ? `+Rs. ${price}` : "Included"}{outOfStock ? " | out of stock" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CustomizationsSection = ({ customizations, selections, setSelections }) => {
  if (customizations.length === 0) return null;

  return (
    <div className="mt-8 space-y-5">
      <h3 className="font-semibold text-gray-800">Customize</h3>
      {customizations.map((group) => (
        <div key={group.name}>
          <p className="text-sm font-semibold text-gray-700 mb-2">{group.name}</p>
          <div className="flex flex-wrap gap-2">
            {(group.options || []).map((opt) => (
              <button
                type="button"
                key={`${group.name}-${opt}`}
                onClick={() => setSelections((prev) => ({ ...prev, [group.name]: opt }))}
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
  );
};

const CookingInstructionsField = ({ cookingInstructions, setCookingInstructions }) => (
  <div className="mt-8">
    <h3 className="font-semibold text-gray-800 mb-2">Cooking instructions</h3>
    <textarea
      value={cookingInstructions}
      onChange={(e) => setCookingInstructions(e.target.value)}
      placeholder="e.g. No onion, less oil, allergy noteÃ¢â‚¬Â¦"
      className="w-full rounded-2xl border border-gray-200 p-3 text-sm min-h-[88px] outline-none focus:ring-2 focus:ring-orange-400"
      maxLength={500}
    />
  </div>
);

const QuantitySelector = ({ quantity, setQuantity }) => (
  <div className="mt-8 flex items-center justify-between">
    <h3 className="font-semibold text-gray-800">
      Quantity
    </h3>

    <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl">
      <button
        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
        className="p-2.5 bg-white rounded-xl"
      >
        <Minus size={18} />
      </button>

      <span className="font-bold w-8 text-center text-lg">
        {quantity}
      </span>

      <button
        onClick={() => setQuantity((prev) => prev + 1)}
        className="p-2.5 bg-white rounded-xl"
      >
        <Plus size={18} />
      </button>
    </div>
  </div>
);

const TotalPanel = ({ total }) => (
  <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
    <div className="flex justify-between">
      <span className="font-semibold text-gray-800">
        Total
      </span>

      <span className="font-bold text-orange-600">
        Rs. {total}
      </span>
    </div>
  </div>
);

const StickyAddButton = ({ isAdding, quantity, total, onAddToCart }) => (
  <div
    style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    className="fixed inset-x-0 z-[85] border-t border-gray-100 bg-white/95 p-4 pb-3 pt-3 backdrop-blur-lg"
  >
    <FramerMotion.motion.button
      onClick={onAddToCart}
      disabled={isAdding}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 shadow-lg shadow-primary-900/25 transition disabled:opacity-70"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <ShoppingCart size={20} className="text-white" />
        </div>
        <div className="text-left">
          <span className="block font-black text-white">
            {isAdding ? "Adding..." : "Add to Cart"}
          </span>
          <span className="text-xs text-white/80">
            {quantity} item{quantity > 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <span className="text-lg font-black text-white">Rs. {total}</span>
    </FramerMotion.motion.button>
  </div>
);

const TAG_BADGES = {
  veg: { label: "Pure Veg", border: "border-green-500", fill: "bg-green-500", text: "text-green-600" },
  egg: { label: "Contains Egg", border: "border-amber-500", fill: "bg-amber-500", text: "text-amber-600" },
  chicken: { label: "Chicken", border: "border-orange-500", fill: "bg-orange-500", text: "text-orange-600" },
  mutton: { label: "Mutton", border: "border-red-500", fill: "bg-red-500", text: "text-red-600" },
  buff: { label: "Buff", border: "border-rose-500", fill: "bg-rose-500", text: "text-rose-600" },
  pork: { label: "Pork", border: "border-pink-500", fill: "bg-pink-500", text: "text-pink-600" },
  fish: { label: "Fish", border: "border-blue-500", fill: "bg-blue-500", text: "text-blue-600" },
  seafood: { label: "Seafood", border: "border-cyan-500", fill: "bg-cyan-500", text: "text-cyan-600" },
};

const ItemDetails = () => {
  const navigate = useNavigate();
  const { slug, token, id } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    item,
    quantity,
    selections,
    variationSelections,
    cookingInstructions,
    isFavorite,
    showMore,
    isAdding,
  } = state;

  const { toasts, removeToast, success, error } = useToast();
  const { addItem, hydrate } = useCustomerCart();

  const setItem = (item) => dispatch({ type: "setItem", item });
  const setQuantity = (value) => dispatch({ type: "setQuantity", value });
  const setSelections = (value) => dispatch({ type: "setSelections", value });
  const setVariationSelections = (value) => dispatch({ type: "setVariationSelections", value });
  const setCookingInstructions = (value) => dispatch({ type: "setCookingInstructions", value });
  const setIsFavorite = (value) => dispatch({ type: "setIsFavorite", value });
  const setShowMore = (value) => dispatch({ type: "setShowMore", value });
  const setIsAdding = (value) => dispatch({ type: "setIsAdding", value });

  useEffect(() => {
    if (token) hydrate(token);
  }, [token, hydrate]);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const qs = new URLSearchParams({ restaurantSlug: slug || "" });
        if (token) qs.set("qrToken", token);
        const res = await api.get(`/restaurant/menu/items/customer/${id}?${qs.toString()}`);
        setItem(res.data.data);
      } catch (err) {
        console.error(err);
        error("Failed to load item details");
      }
    };

    fetchItemDetails();
  }, [id, slug, token]);

  useEffect(() => {
    const groups = item?.customizations;
    if (!groups?.length) {
      setSelections({});
      return;
    }
    const init = {};
    groups.forEach((c) => {
      if (c?.name && c?.options?.length) init[c.name] = c.options[0];
    });
    setSelections(init);
  }, [item._id]);

  useEffect(() => {
    const groups = Array.isArray(item?.variationGroups)
      ? item.variationGroups.filter((g) => g?.isActive !== false)
      : [];
    const init = {};
    groups.forEach((group) => {
      const defaults = (group.options || []).filter((option) => option.isAvailable !== false && option.isDefault);
      if (group.selectionType === "multiple" || group.selectionType === "quantity") {
        init[group._id] = defaults.map((option) => ({
          optionId: option._id,
          quantity: Math.max(1, Number(option.minQuantity || 1)),
        }));
      } else {
        const first = defaults[0] || (group.isRequired ? (group.options || []).find((option) => option.isAvailable !== false) : null);
        init[group._id] = first ? [{ optionId: first._id, quantity: 1 }] : [];
      }
    });
    setVariationSelections(init);
  }, [item._id, item?.variationGroups]);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  const nutritionalInfo = useMemo(() => {
    const n = item?.nutrition || {};
    return [
      { key: "protein", label: "Protein", unit: "g" },
      { key: "carbs", label: "Carbs", unit: "g" },
      { key: "fat", label: "Fat", unit: "g" },
      { key: "fiber", label: "Fiber", unit: "g" },
    ].reduce((rows, macro) => {
      if (!Number.isFinite(Number(n[macro.key]))) return rows;
      rows.push({ label: macro.label, value: `${Number(n[macro.key])}${macro.unit}` });
      return rows;
    }, []);
  }, [item?.nutrition]);

  const dietaryBadges = useMemo(() => {
    const tags = Array.isArray(item?.dietaryTags) ? item.dietaryTags : [];
    if (tags.length > 0) return tags.flatMap((tag) => (TAG_BADGES[tag] ? [TAG_BADGES[tag]] : []));
    if (item?.isVegetarian) return [TAG_BADGES.veg];
    return [{ label: "Non-Veg", border: "border-red-500", fill: "bg-red-500", text: "text-red-600" }];
  }, [item?.dietaryTags, item?.isVegetarian]);

  const activeVariationGroups = useMemo(
    () => (Array.isArray(item?.variationGroups) ? item.variationGroups.filter((g) => g?.isActive !== false) : []),
    [item?.variationGroups],
  );

  const selectedVariationPayload = useMemo(
    () =>
      Object.entries(variationSelections).flatMap(([groupId, rows]) =>
        (Array.isArray(rows) ? rows : []).map((row) => ({
          groupId,
          optionId: row.optionId,
          quantity: Math.max(1, Number(row.quantity || 1)),
        })),
      ),
    [variationSelections],
  );

  const selectedVariationSnapshots = useMemo(() => {
    const out = [];
    activeVariationGroups.forEach((group) => {
      const rows = variationSelections[group._id] || [];
      rows.forEach((row) => {
        const option = (group.options || []).find((opt) => String(opt._id) === String(row.optionId));
        if (!option) return;
        const unitPrice = Number(option.discountedPrice ?? option.additionalPrice ?? 0);
        const qty = Math.max(1, Number(row.quantity || 1));
        out.push({
          groupId: group._id,
          groupName: group.name,
          groupType: group.type,
          selectionType: group.selectionType,
          optionId: option._id,
          optionName: option.name,
          sku: option.sku || "",
          quantity: qty,
          unitPrice,
          totalPrice: unitPrice * qty,
          image: option.image || "",
          isAddOn: ["addon", "topping"].includes(group.type) || group.selectionType !== "single",
        });
      });
    });
    return out;
  }, [activeVariationGroups, variationSelections]);

  const variationValidation = useMemo(() => {
    const errors = [];
    activeVariationGroups.forEach((group) => {
      const rows = variationSelections[group._id] || [];
      const min = Number(group.minSelection ?? (group.isRequired ? 1 : 0));
      const max = Number(group.maxSelection || (group.selectionType === "single" ? 1 : 999));
      if (group.isRequired && rows.length === 0) errors.push(`${group.name} is required`);
      if (rows.length < min) errors.push(`${group.name} needs at least ${min}`);
      if (group.selectionType === "single" && rows.length > 1) errors.push(`${group.name} allows one option`);
      if (max > 0 && rows.length > max) errors.push(`${group.name} allows at most ${max}`);
      rows.forEach((row) => {
        const option = (group.options || []).find((opt) => String(opt._id) === String(row.optionId));
        const qty = Math.max(1, Number(row.quantity || 1));
        if (!option || option.isAvailable === false) errors.push(`${group.name} has an unavailable option`);
        if (option?.trackInventory && option.stockQuantity != null && Number(option.stockQuantity) < qty) {
          errors.push(`${option.name} is out of stock`);
        }
      });
    });
    return errors;
  }, [activeVariationGroups, variationSelections]);

  const liveUnitPrice = useMemo(
    () => Number(item.price || 0) + selectedVariationSnapshots.reduce((sum, row) => sum + Number(row.totalPrice || 0), 0),
    [item.price, selectedVariationSnapshots],
  );

  const lineTotal = () => liveUnitPrice * quantity;

  const setSingleVariation = (groupId, optionId) => {
    setVariationSelections((prev) => ({ ...prev, [groupId]: [{ optionId, quantity: 1 }] }));
  };

  const toggleMultiVariation = (group, optionId) => {
    setVariationSelections((prev) => {
      const rows = prev[group._id] || [];
      const exists = rows.some((row) => String(row.optionId) === String(optionId));
      const nextRows = exists
        ? rows.filter((row) => String(row.optionId) !== String(optionId))
        : [...rows, { optionId, quantity: 1 }].slice(0, Number(group.maxSelection || 999));
      return { ...prev, [group._id]: nextRows };
    });
  };

  const setVariationQuantity = (group, option, nextQuantity) => {
    const qty = Math.max(0, Math.min(Number(option.maxQuantity || 99), Number(nextQuantity || 0)));
    setVariationSelections((prev) => {
      const rows = (prev[group._id] || []).filter((row) => String(row.optionId) !== String(option._id));
      return { ...prev, [group._id]: qty > 0 ? [...rows, { optionId: option._id, quantity: qty }] : rows };
    });
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = item?.name || "Menu item";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Check out ${title} on the menu`, url });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`, "_blank");
      }
    } catch (err) {
      if (url) {
        await navigator.clipboard?.writeText?.(url);
        success("Link copied");
      }
    }
  };

  const handleAddToCart = async () => {
    if (!item?._id || isAdding) return;
    try {
      setIsAdding(true);
      const { customizations, addOnLabels } = Object.entries(selections).reduce(
        (acc, [name, value]) => {
          acc.customizations.push({ name, value });
          if (/add|extra|topping/i.test(name)) acc.addOnLabels.push(value);
          return acc;
        },
        { customizations: [], addOnLabels: [] },
      );

      if (variationValidation.length > 0) {
        error(variationValidation[0]);
        return;
      }

      const result = await addItem({ ...item, price: liveUnitPrice }, {
        quantity,
        cookingInstructions: cookingInstructions.slice(0, 500),
        customizations,
        addOns: addOnLabels,
        selectedVariations: selectedVariationPayload,
        openDrawer: true,
      });

      if (result) success(`${item.name} added to cart`);
    } catch (err) {
      console.error(err);
      error("Failed to add item to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const descriptionLines = item.description?.split("\n").filter(Boolean) || [];
  const visibleLines = showMore ? descriptionLines : descriptionLines.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-44">
      <ItemHero
        item={item}
        isFavorite={isFavorite}
        onBack={() => navigate(-1)}
        onFavoriteToggle={() => setIsFavorite(!isFavorite)}
        onShare={handleShare}
      />

      <div className="px-5 -mt-8 relative bg-white rounded-t-3xl pt-6">
        <ItemSummary item={item} dietaryBadges={dietaryBadges} liveUnitPrice={liveUnitPrice} />
        <DescriptionSection
          visibleLines={visibleLines}
          descriptionLines={descriptionLines}
          showMore={showMore}
          onToggle={() => setShowMore(!showMore)}
        />
        <NutritionSection nutritionalInfo={nutritionalInfo} />
        <VariationGroupsSection
          activeVariationGroups={activeVariationGroups}
          variationSelections={variationSelections}
          setSingleVariation={setSingleVariation}
          toggleMultiVariation={toggleMultiVariation}
          setVariationQuantity={setVariationQuantity}
        />
        <CustomizationsSection
          customizations={item.customizations || []}
          selections={selections}
          setSelections={setSelections}
        />
        <CookingInstructionsField
          cookingInstructions={cookingInstructions}
          setCookingInstructions={setCookingInstructions}
        />
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        <TotalPanel total={lineTotal()} />
      </div>

      <StickyAddButton
        isAdding={isAdding}
        quantity={quantity}
        total={lineTotal()}
        onAddToCart={handleAddToCart}
      />
      <Navigation />
      <CartDrawer />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ItemDetails;