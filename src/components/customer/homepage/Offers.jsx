import { useEffect, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { X, Tag, Clock, DollarSign, Copy, Check, AlertCircle } from "lucide-react";
import api from "../../../services/api";

// ── Helpers
function getDaysLeft(validUntil) {
  const diff = new Date(validUntil) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ validUntil }) {
  const days = getDaysLeft(validUntil);

  if (days <= 0)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
        Expired
      </span>
    );
  if (days <= 3)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
        <AlertCircle size={9} /> Expires in {days}d
      </span>
    );
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">
        <Clock size={9} /> {days} days left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
      <Clock size={9} /> Valid {days} days
    </span>
  );
}

function MinOrderBadge({ minOrderAmount }) {
  if (!minOrderAmount) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
      <DollarSign size={9} /> Min. ₹{minOrderAmount}
    </span>
  );
}

// ── Skeleton
function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-4 w-16 bg-gray-100 rounded-full" />
          <div className="h-4 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Offer card
function OfferCard({ offer, index }) {
  const [copied, setCopied] = useState(false);
  const isExpired = getDaysLeft(offer.endAt) <= 0;

  // Soft background colors cycling through offers
  const softColors = [
    { bg: "bg-orange-500", light: "bg-orange-50" },
    { bg: "bg-violet-500", light: "bg-violet-50" },
    { bg: "bg-cyan-500",   light: "bg-cyan-50"   },
    { bg: "bg-rose-500",   light: "bg-rose-50"   },
    { bg: "bg-emerald-500",light: "bg-emerald-50" },
  ];
  const color = softColors[index % softColors.length];

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(offer.code);
      } else {
        const el = document.createElement("textarea");
        el.value = offer.code;
        el.style.cssText = "position: fixed; left: -9999px;";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const codeEl = document.getElementById(`code-${offer._id}`);
      if (codeEl) {
        const range = document.createRange();
        range.selectNode(codeEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex gap-3 items-center p-3 bg-white rounded-2xl border border-gray-100 ${
        isExpired ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Left — discount badge */}
      <div
        className={`${color.bg} w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-white`}
      >
        <span className="text-lg font-black leading-none">
          {offer.discountType === "percent"
            ? `${offer.discountValue}%`
            : `₹${offer.discountValue}`}
        </span>
        <span className="text-[9px] font-semibold tracking-wider opacity-90">
          OFF
        </span>
      </div>

      {/* Centre — info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 truncate">{offer.name}</h3>

        {/* Dashed code box */}
        <div className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-lg border border-dashed border-gray-300 ${color.light}`}>
          <span
            id={`code-${offer._id}`}
            className="text-xs font-mono font-bold text-gray-600 tracking-wider"
          >
            {offer.code}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <MinOrderBadge minOrderAmount={offer.minOrderAmount} />
          <ExpiryBadge validUntil={offer.endAt} />
        </div>
      </div>

      {/* Right — copy button */}
      <button
        onClick={handleCopy}
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          copied
            ? "bg-green-100 text-green-600"
            : `${color.light} text-gray-600 hover:opacity-80`
        }`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </m.div>
  );
}

// ── Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14">
      <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
        <Tag size={26} className="text-orange-300" />
      </div>
      <p className="text-sm font-semibold text-gray-600">No offers available</p>
      <p className="text-xs text-gray-400 mt-1">Check back soon for deals!</p>
    </div>
  );
}

// ── Main bottom sheet
export default function Offers({ isOpen, onClose, slug }) {
  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (isOpen && slug) fetchOffers();
  }, [isOpen, slug]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customer/offers/${slug}`);
      setOffersData(res?.data?.data || []);
    } catch {
      setOffersData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const sorted = offersData.toSorted(
    (a, b) => getDaysLeft(b.endAt) - getDaysLeft(a.endAt)
  );

  const activeCount = offersData.filter(o => getDaysLeft(o.endAt) > 0).length;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sheet */}
          <m.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden z-50 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Tag size={18} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800 leading-none">
                    Special Offers
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {activeCount} deal{activeCount !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Thin divider */}
            <div className="mx-5 h-px bg-gray-100" />

            {/* List */}
            <div className="px-4 pt-3 pb-6 space-y-2.5 overflow-y-auto max-h-[68vh]">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : sorted.length === 0 ? (
                <EmptyState />
              ) : (
                sorted.map((offer, i) => (
                  <OfferCard key={offer._id} offer={offer} index={i} />
                ))
              )}
            </div>
          </m.div>
        </>
      )}
      </AnimatePresence>
    </LazyMotion>
  );
}
