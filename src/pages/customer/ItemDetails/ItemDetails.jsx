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
  MessageSquare,
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
import { ensureGuestSession, getItemReviews, submitItemReview } from "../../../services/customer";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";
import { isTierPricingGroup } from "../../../utils/menuVariationSuggestions";
import { resolveMediaUrl } from "../../../utils/mediaUrl";

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

const formatMoney = (value) => Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2);

const ItemHero = ({ item, isFavorite, onBack, onFavoriteToggle, onShare }) => (
  <header className="relative h-[45vh] w-full overflow-hidden md:h-[28rem]">
    {resolveMediaUrl(item.image) ? (
      <img
        src={resolveMediaUrl(item.image)}
        alt={item.name || "Menu item"}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[#f6f3f0] to-[#ffdbcd]" />
    )}

    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-70% to-[#fcf9f6]" />

    <nav className="absolute left-5 right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-20 flex items-center justify-between">
      <FramerMotion.motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/35"
        aria-label="Go back"
      >
        <ArrowLeft size={22} />
      </FramerMotion.motion.button>

      <div className="flex gap-3">
        <FramerMotion.motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/35"
          aria-label="Share item"
        >
          <Share2 size={20} />
        </FramerMotion.motion.button>

        <FramerMotion.motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onFavoriteToggle}
          className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition hover:bg-white/35 ${
            isFavorite ? "bg-red-500 text-white" : "bg-white/20 text-white"
          }`}
          aria-label="Favorite item"
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </FramerMotion.motion.button>
      </div>
    </nav>

    {(item.isBestseller || item.highlightTag === "trending") && (
      <div className="absolute bottom-16 left-6 rounded-full bg-[#894f40] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
        {item.highlightTag === "trending" ? "Trending" : "Bestseller"}
      </div>
    )}
    {item.highlightTag === "chef_special" && (
      <div className="absolute bottom-16 right-6 rounded-full bg-[#2a674c] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
        Chef special
      </div>
    )}
  </header>
);

const ItemSummary = ({ item, dietaryBadges, liveUnitPrice, reviewSummary }) => (
  <>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {dietaryBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-1">
              <div className={`flex h-[14px] w-[14px] items-center justify-center border-2 ${badge.border}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${badge.fill}`} />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          ))}
        </div>
        <h1 className="text-[28px] font-black leading-[34px] text-[#1c1c1a]">
          {item.name || "Menu item"}
        </h1>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[22px] font-black leading-6 text-[#9f3d00]">
          Rs. {formatMoney(liveUnitPrice)}
        </p>

        {item.originalPrice && (
          <p className="text-xs font-bold text-[#594137] line-through">
            Rs. {item.originalPrice}
          </p>
        )}
      </div>
    </div>

    <div className="mt-4 grid grid-cols-3 items-center gap-2 border-y border-[#e1bfb2]/50 py-4 text-sm">
      <div className="flex items-center gap-1.5">
        <Star size={18} className="fill-[#a33e00] text-[#a33e00]" />
        <span className="font-black text-[#1c1c1a]">{reviewSummary.average || item.rating || 4.5}</span>
        <span className="hidden text-[#594137] xs:inline">({reviewSummary.total || item.reviews || 0})</span>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-x border-[#e1bfb2]/50 px-2">
        <Clock size={18} className="text-[#894f40]" />
        <span className="truncate text-[#1c1c1a]">{item.prepTime || (item.preparationTime ? `${item.preparationTime} min` : "15-20 min")}</span>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Flame size={18} className="text-[#2a674c]" />
        <span className="truncate text-[#1c1c1a]">
          {Number.isFinite(Number(item?.nutrition?.calories)) ? `${Number(item.nutrition.calories)} kcal` : "Fresh"}
        </span>
      </div>
    </div>
  </>
);

const DescriptionSection = ({ visibleLines, descriptionLines, showMore, onToggle }) => {
  if (descriptionLines.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-xl font-black text-[#1c1c1a]">
        About this item
      </h2>

      <div className="mt-2 space-y-2">
        {visibleLines.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-[#594137]">
            {line}
          </p>
        ))}
      </div>

      {descriptionLines.length > 2 && (
        <button
          onClick={onToggle}
          className="mt-3 flex items-center gap-1 text-sm font-bold text-[#9f3d00]"
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
    </section>
  );
};

const NutritionSection = ({ nutritionalInfo }) => {
  if (nutritionalInfo.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-xl font-black text-[#1c1c1a]">
        Nutritional Facts
      </h2>

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
          <div key={nutrient.label} className="rounded-xl bg-[#f6f3f0] p-3 text-center">
            <p className="text-xs font-black text-[#1c1c1a]">
              {nutrient.value}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#594137]">
              {nutrient.label}
            </p>
          </div>
        ))}
      </div>
    </section>
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
    <div className="mt-6 space-y-8">
      {activeVariationGroups.map((group) => {
        const selectedRows = variationSelections[group._id] || [];
        const display = group.displayType || (group.selectionType === "multiple" ? "checkbox" : "chips");
        const isAddOnGroup = ["addon", "topping"].includes(group.type) || group.selectionType === "multiple";
        return (
          <section key={group._id}>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1c1c1a]">{group.name}</h2>
                {group.maxSelection > 1 && (
                  <p className="mt-1 text-xs font-bold text-[#594137]">Choose up to {group.maxSelection}</p>
                )}
              </div>
              <span className={`rounded px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                group.isRequired ? "bg-[#ffdbcd] text-[#9f3d00]" : "bg-[#e5e2df] text-[#594137]"
              }`}>
                {group.isRequired ? "Required" : "Optional"}
              </span>
            </div>

            {display === "dropdown" ? (
              <select
                value={selectedRows[0]?.optionId || ""}
                onChange={(e) => setSingleVariation(group._id, e.target.value)}
                className="w-full rounded-xl border border-[#e1bfb2] bg-white p-3 text-sm font-bold text-[#1c1c1a] outline-none focus:ring-2 focus:ring-[#ffb596]"
              >
                {!group.isRequired && <option value="">No selection</option>}
                {(group.options || []).map((option) => {
                  const price = Number(option.discountedPrice ?? option.additionalPrice ?? 0);
                  const tier = isTierPricingGroup(group);
                  return (
                  <option key={option._id} value={option._id} disabled={option.isAvailable === false || (option.trackInventory && Number(option.stockQuantity || 0) <= 0)}>
                    {option.name}{tier ? ` — Rs. ${price}` : Number(price) > 0 ? ` (+Rs. ${price})` : ""}
                  </option>
                )})}
              </select>
            ) : (
              <div className={
                display === "cards" || display === "image"
                  ? "grid grid-cols-2 gap-3"
                  : isAddOnGroup
                    ? "space-y-3"
                    : "flex flex-wrap gap-3"
              }>
                {(group.options || []).map((option) => {
                  const selected = selectedRows.some((row) => String(row.optionId) === String(option._id));
                  const row = selectedRows.find((r) => String(r.optionId) === String(option._id));
                  const outOfStock = option.trackInventory && Number(option.stockQuantity || 0) <= 0;
                  const unavailable = option.isAvailable === false || outOfStock;
                  const price = Number(option.discountedPrice ?? option.additionalPrice ?? 0);
                  const tier = isTierPricingGroup(group);
                  const priceLabel = tier
                    ? `Rs. ${price}`
                    : price > 0
                      ? `+Rs. ${price}`
                      : "Included";
                  if (group.selectionType === "quantity" || display === "stepper") {
                    const qty = Number(row?.quantity || 0);
                    return (
                      <div key={option._id} className={`flex items-center justify-between gap-3 rounded-xl border bg-[#f6f3f0] p-4 ${qty > 0 ? "border-[#9f3d00]" : "border-transparent"} ${unavailable ? "opacity-50" : ""}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#1c1c1a]">{option.name}</p>
                          <p className="text-xs font-bold text-[#594137]">
                            {priceLabel}{outOfStock ? " | out of stock" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" disabled={unavailable || qty <= 0} onClick={() => setVariationQuantity(group, option, qty - 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-black text-[#1c1c1a] disabled:opacity-40"><Minus size={16} /></button>
                          <span className="w-5 text-center text-sm font-black">{qty}</span>
                          <button type="button" disabled={unavailable} onClick={() => setVariationQuantity(group, option, qty + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9f3d00] font-black text-white disabled:opacity-40"><Plus size={16} /></button>
                        </div>
                      </div>
                    );
                  }
                  if (isAddOnGroup) {
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
                        className={`flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left transition ${
                          selected ? "bg-[#ffdbcd] ring-2 ring-[#9f3d00]" : "bg-[#f6f3f0]"
                        } ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            selected ? "border-[#9f3d00] bg-[#9f3d00]" : "border-[#8d7165] bg-white"
                          }`}>
                            {selected && <span className="h-2 w-2 rounded-sm bg-white" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-[#1c1c1a]">{option.name}</span>
                            <span className="block text-xs font-bold text-[#594137]">{outOfStock ? "Out of stock" : "Extra option"}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-black text-[#894f40]">
                          {price > 0 ? `+Rs. ${formatMoney(price)}` : "Included"}
                        </span>
                      </button>
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
                      className={`${display === "cards" || display === "image" ? "min-h-[96px] text-left" : "rounded-full"} border px-5 py-3 text-sm font-bold transition active:scale-95 ${
                        selected
                          ? "border-[#894f40] bg-[#894f40] text-white"
                          : "border-[#e1bfb2] bg-white text-[#1c1c1a] hover:border-[#9f3d00]"
                      } ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {display === "image" && option.image ? (
                        <img src={resolveMediaUrl(option.image)} alt={option.name} className="mb-2 h-16 w-full rounded-lg object-cover" />
                      ) : null}
                      <span className="block">{option.name}</span>
                      <span className={`mt-0.5 block text-[11px] ${selected ? "text-white/80" : "text-[#594137]"}`}>
                        {priceLabel}{outOfStock ? " | out of stock" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

const CustomizationsSection = ({ customizations, selections, setSelections }) => {
  if (customizations.length === 0) return null;

  return (
    <div className="mt-8 space-y-8">
      {customizations.map((group) => (
        <section key={group.name}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-black text-[#1c1c1a]">{group.name}</h2>
            <span className="rounded bg-[#e5e2df] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#594137]">
              Optional
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {(group.options || []).map((opt) => (
              <button
                type="button"
                key={`${group.name}-${opt}`}
                onClick={() => setSelections((prev) => ({ ...prev, [group.name]: opt }))}
                className={`rounded-full border px-5 py-3 text-sm font-bold transition active:scale-95 ${
                  selections[group.name] === opt
                    ? "border-[#894f40] bg-[#894f40] text-white"
                    : "border-[#e1bfb2] bg-white text-[#1c1c1a] hover:border-[#9f3d00]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const CookingInstructionsField = ({ cookingInstructions, setCookingInstructions }) => (
  <section className="mt-8">
    <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-[#1c1c1a]">
      <MessageSquare size={19} className="text-[#894f40]" />
      Cooking instructions
    </h2>
    <textarea
      value={cookingInstructions}
      onChange={(e) => setCookingInstructions(e.target.value)}
      placeholder="e.g. No onion, less oil, allergy note..."
      className="min-h-[88px] w-full rounded-xl border border-[#e1bfb2] bg-white p-4 text-sm text-[#1c1c1a] outline-none placeholder:text-[#8d7165] focus:ring-2 focus:ring-[#ffb596]"
      maxLength={500}
    />
  </section>
);

const ItemReviewsSection = ({
  reviewSummary,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  isSubmitting,
  onSubmit,
}) => (
  <section className="mt-8 rounded-xl border border-[#e1bfb2]/60 bg-white p-5 shadow-[0_10px_24px_rgba(137,79,64,0.06)]">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-[#1c1c1a]">Item Reviews</h2>
        <p className="mt-1 text-sm font-bold text-[#594137]">
          {reviewSummary.total > 0
            ? `${reviewSummary.average} average from ${reviewSummary.total} review${reviewSummary.total === 1 ? "" : "s"}`
            : "Be the first to review this item"}
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-[#ffdbcd] px-3 py-1.5 text-[#9f3d00]">
        <Star size={16} className="fill-current" />
        <span className="text-sm font-black">{reviewSummary.average || "New"}</span>
      </div>
    </div>

    <div className="mt-5 rounded-xl bg-[#f6f3f0] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-black text-[#1c1c1a]">Your rating</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setReviewRating(value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition active:scale-95"
              aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
            >
              <Star
                size={21}
                fill={value <= reviewRating ? "#1c1c1a" : "none"}
                stroke={value <= reviewRating ? "#1c1c1a" : "#8d7165"}
                strokeWidth={value <= reviewRating ? 2.6 : 2}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={reviewComment}
        onChange={(e) => setReviewComment(e.target.value)}
        placeholder="Share a short note about taste, portion, or spice level..."
        className="mt-3 min-h-[88px] w-full rounded-xl border border-[#e1bfb2] bg-white p-3 text-sm text-[#1c1c1a] outline-none placeholder:text-[#8d7165] focus:ring-2 focus:ring-[#ffb596]"
        maxLength={300}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#9f3d00] px-5 py-3 text-sm font-black text-white transition active:scale-95 disabled:opacity-70 sm:w-auto"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>

    {reviewSummary.loading ? (
      <p className="mt-4 text-sm font-bold text-[#594137]">Loading reviews...</p>
    ) : reviewSummary.reviews.length > 0 ? (
      <div className="mt-5 space-y-3">
        {reviewSummary.reviews.map((review) => (
          <article key={review.id || review.createdAt} className="rounded-xl bg-[#fcf9f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-black text-[#1c1c1a]">
                  {review.customerName || review.guestId || "Guest customer"}
                </p>
                {review.createdAt && (
                  <p className="mt-0.5 text-xs font-bold text-[#8d7165]">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[#a33e00]">
                <Star size={15} className="fill-current" />
                <span className="text-sm font-black">{review.rating}</span>
              </div>
            </div>
            {review.comment && <p className="mt-3 text-sm leading-relaxed text-[#594137]">{review.comment}</p>}
          </article>
        ))}
      </div>
    ) : null}
  </section>
);

const StickyAddButton = ({ isAdding, quantity, total, setQuantity, onAddToCart }) => (
  <div
    style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    className="fixed inset-x-0 z-[85] border-t border-[#e1bfb2]/50 bg-[#fcf9f6]/85 px-5 py-5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl"
  >
    <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
      <div className="min-w-[86px]">
        <span className="block text-[11px] font-black uppercase tracking-wider text-[#594137]">Total Price</span>
        <span className="block text-2xl font-black text-[#1c1c1a]">Rs. {formatMoney(total)}</span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center rounded-full border border-[#e1bfb2] bg-[#eae8e5] p-1">
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1c1c1a] transition hover:text-[#9f3d00]"
            aria-label="Decrease quantity"
          >
            <Minus size={18} />
          </button>
          <span className="w-8 text-center text-lg font-black text-[#1c1c1a]">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((prev) => prev + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1c1c1a] transition hover:text-[#9f3d00]"
            aria-label="Increase quantity"
          >
            <Plus size={18} />
          </button>
        </div>

        <FramerMotion.motion.button
          onClick={onAddToCart}
          disabled={isAdding}
          whileTap={{ scale: 0.95 }}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#9f3d00] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#9f3d00]/20 transition hover:opacity-90 disabled:opacity-70 sm:px-8"
        >
          <span className="hidden xs:inline">{isAdding ? "Adding..." : "Add to Cart"}</span>
          <span className="xs:hidden">{isAdding ? "Adding" : "Add"}</span>
          <ShoppingCart size={20} />
        </FramerMotion.motion.button>
      </div>
    </div>
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
  const [reviewSummary, setReviewSummary] = React.useState({ loading: true, average: 0, total: 0, reviews: [] });
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewComment, setReviewComment] = React.useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = React.useState(false);

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

  const loadReviews = React.useCallback(async () => {
    if (!id) return;
    try {
      setReviewSummary((prev) => ({ ...prev, loading: true }));
      const data = await getItemReviews(id);
      setReviewSummary({
        loading: false,
        average: Number(data.average || 0),
        total: Number(data.total || 0),
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
      });
    } catch (err) {
      console.error(err);
      setReviewSummary({ loading: false, average: 0, total: 0, reviews: [] });
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
        const isAddOn =
          ["addon", "topping"].includes(group.type) ||
          group.selectionType === "multiple" ||
          group.selectionType === "quantity";
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
          isAddOn,
          isTier: isTierPricingGroup(group),
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

  const liveUnitPrice = useMemo(() => {
    const base = Number(item.price || 0);
    let tierTotal = null;
    let additive = 0;
    let addons = 0;
    selectedVariationSnapshots.forEach((row) => {
      if (row.isTier) {
        tierTotal = (tierTotal || 0) + Number(row.totalPrice || 0);
      } else if (row.isAddOn) {
        addons += Number(row.totalPrice || 0);
      } else {
        additive += Number(row.totalPrice || 0);
      }
    });
    const core = tierTotal != null ? tierTotal : base;
    return core + additive + addons;
  }, [item.price, selectedVariationSnapshots]);

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

  const handleSubmitReview = async () => {
    if (!reviewRating) {
      error("Please choose a star rating");
      return;
    }
    if (!token) {
      error("Open this menu from a table QR to review items");
      return;
    }

    try {
      setIsReviewSubmitting(true);
      const session = await ensureGuestSession(token);
      await submitItemReview({
        menuItemId: id,
        qrToken: token,
        guestId: session?.guestId,
        rating: reviewRating,
        comment: reviewComment,
      });
      success("Review submitted");
      setReviewRating(0);
      setReviewComment("");
      await loadReviews();
    } catch (err) {
      console.error(err);
      error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setIsReviewSubmitting(false);
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
    <div className="min-h-screen bg-[#fcf9f6] pb-52 text-[#1c1c1a]">
      <ItemHero
        item={item}
        isFavorite={isFavorite}
        onBack={() => navigate(-1)}
        onFavoriteToggle={() => setIsFavorite(!isFavorite)}
        onShare={handleShare}
      />

      <main className="relative z-30 -mt-12 mx-auto w-full max-w-4xl px-5">
        <div className="rounded-xl bg-white p-6 shadow-[0_15px_30px_rgba(137,79,64,0.08)]">
          <ItemSummary
            item={item}
            dietaryBadges={dietaryBadges}
            liveUnitPrice={liveUnitPrice}
            reviewSummary={reviewSummary}
          />
          <DescriptionSection
            visibleLines={visibleLines}
            descriptionLines={descriptionLines}
            showMore={showMore}
            onToggle={() => setShowMore(!showMore)}
          />
        </div>

        <div className="mt-6">
          <NutritionSection nutritionalInfo={nutritionalInfo} />
        </div>
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
        <ItemReviewsSection
          reviewSummary={reviewSummary}
          reviewRating={reviewRating}
          setReviewRating={setReviewRating}
          reviewComment={reviewComment}
          setReviewComment={setReviewComment}
          isSubmitting={isReviewSubmitting}
          onSubmit={handleSubmitReview}
        />
      </main>

      <StickyAddButton
        isAdding={isAdding}
        quantity={quantity}
        total={lineTotal()}
        setQuantity={setQuantity}
        onAddToCart={handleAddToCart}
      />
      <Navigation />
      <CartDrawer />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ItemDetails;
