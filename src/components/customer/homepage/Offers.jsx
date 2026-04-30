import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Tag,
  Clock,
  DollarSign,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

// ── Offer data
// Added two new fields per offer:
//   minOrder  — minimum cart total required (null = no minimum)
//   validUntil — ISO date string for accurate countdown calculation
const offersData = [
  {
    id: 1,
    title: "50% OFF",
    description: "On all biryanis",
    code: "BIRYANI50",
    validUntil: "2026-12-31",
    color: "bg-red-500",
    minOrder: null,
  },
  {
    id: 2,
    title: "Buy 1 Get 1",
    description: "Free pizza on weekends",
    code: "PIZZA1FREE",
    validUntil: "2024-11-30",
    color: "bg-green-500",
    minOrder: 299,
  },
  {
    id: 3,
    title: "20% OFF",
    description: "On all drinks & beverages",
    code: "DRINK20",
    validUntil: "2026-05-03",
    color: "bg-blue-500",
    minOrder: 199,
  },
  {
    id: 4,
    title: "Free Dessert",
    description: "On orders above ₹500",
    code: "DESSERTFREE",
    validUntil: "2026-12-31",
    color: "bg-purple-500",
    minOrder: 500,
  },
  {
    id: 5,
    title: "15% OFF",
    description: "On combo meals",
    code: "COMBO15",
    validUntil: "2026-04-30",
    color: "bg-orange-500",
    minOrder: 349,
  },
];

// ── Returns days remaining as an integer (negative = already expired)
function getDaysLeft(validUntil) {
  const diff = new Date(validUntil) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Expiry countdown badge
// Colour-coded: green (safe) → amber (≤7 days) → red (≤3 days) → grey (expired)
function ExpiryBadge({ validUntil }) {
  const days = getDaysLeft(validUntil);

  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
        Expired
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
        <AlertCircle size={9} />
        Expires in {days}d
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
        <Clock size={9} />
        {days} days left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
      <Clock size={9} />
      Valid {days} days
    </span>
  );
}

// ── Minimum order badge — only renders if minOrder is set
function MinOrderBadge({ minOrder }) {
  if (!minOrder) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
      <DollarSign size={9} />
      Min. ₹{minOrder}
    </span>
  );
}

// ── Single offer card
function OfferCard({ offer }) {
  const [copied, setCopied] = useState(false);
  const isExpired = getDaysLeft(offer.validUntil) <= 0;

  const handleCopy = async () => {
    try {
      // Try clipboard API first (works on HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(offer.code);
      } else {
        // Fallback for mobile/HTTP: create temporary textarea
        const textArea = document.createElement("textarea");
        textArea.value = offer.code;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback: select the code text for manual copy
      const codeElement = document.getElementById(`code-${offer.id}`);
      if (codeElement) {
        const range = document.createRange();
        range.selectNode(codeElement);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 flex items-start gap-3 border border-gray-100 ${isExpired ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Colour badge */}
      <div
        className={`${offer.color} min-w-12 sm:min-w-14 md:min-w-16 aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center text-white flex-0 p-1.5`}
      >
        <span
          className="text-[9px] sm:text-[11px] md:text-xs font-black text-center leading-tight wrap-break-words w-full overflow-hidden line-clamp-3"
          title={offer.title} // full title on hover as fallback
        >
          {offer.title}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-800">
          {offer.description}
        </h3>

        {/* Code + badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {/* Promo code pill */}
          <span
            id={`code-${offer.id}`}
            className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200"
          >
            {offer.code}
          </span>

          {/* Min order badge */}
          <MinOrderBadge minOrder={offer.minOrder} />

          {/* Expiry countdown */}
          <ExpiryBadge validUntil={offer.validUntil} />
        </div>

        {/* Expired label */}
        {isExpired && (
          <p className="text-[10px] text-gray-400 font-medium mt-1.5 uppercase tracking-wide">
            This offer has expired
          </p>
        )}
      </div>

      {/* Copy button with feedback */}
      <button
        onClick={handleCopy}
        className={`p-2 rounded-xl transition-colors flex-0 ${
          copied
            ? "bg-green-100 text-green-600"
            : "bg-orange-100 text-orange-500 hover:bg-orange-200"
        }`}
        title="Copy code"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}

// ── Main Offers bottom sheet
export default function Offers({ isOpen, onClose }) {
  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden z-50 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-linear-to-r from-orange-500 to-red-500 mx-4 mt-4 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Tag size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Special Offers</h2>
                    <p className="text-sm opacity-90">Grab the best deals!</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Offer list — expired cards sink to the bottom */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {[...offersData]
                .sort(
                  (a, b) =>
                    getDaysLeft(b.validUntil) - getDaysLeft(a.validUntil),
                )
                .map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
