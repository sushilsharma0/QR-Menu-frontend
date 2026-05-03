import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Tag, Copy, Check, AlertCircle, Clock, DollarSign } from "lucide-react";
import Offers from "./Offers";
import { useParams } from "react-router-dom";

/* ── Helpers ── */

function getDaysLeft(validUntil) {
  const diff = new Date(validUntil) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ validUntil }) {
  const days = getDaysLeft(validUntil);
  if (days <= 0) return null;

  const base = "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full";

  if (days <= 3)
    return (
      <span className={`${base} bg-red-50 text-red-700 border border-red-200`}>
        <AlertCircle size={9} /> Expires in {days}d
      </span>
    );

  if (days <= 7)
    return (
      <span className={`${base} bg-orange-50 text-orange-700 border border-orange-200`}>
        <Clock size={9} /> {days} days left
      </span>
    );

  return (
    <span className={`${base} bg-green-50 text-green-700 border border-green-200`}>
      <Clock size={9} /> Valid {days} days
    </span>
  );
}

function MinOrderBadge({ minOrderAmount }) {
  if (!minOrderAmount || minOrderAmount === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
      <DollarSign size={9} /> Min ₹{minOrderAmount}
    </span>
  );
}

/* ── Promo Card ── */

function PromoCardModal({ promo }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const discountText =
    promo.discountType === "percent"
      ? `${promo.discountValue}%`
      : `₹${promo.discountValue}`;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-3 sm:p-4 shadow-sm flex gap-3 items-start sm:items-center"
    >
      <div className="bg-gradient-to-br from-orange-500 to-red-500 min-w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">
        {discountText} OFF
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-800">
          {promo.name || promo.bannerText}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs font-mono bg-white text-orange-600 px-2 py-1 rounded border font-bold">
            {promo.code}
          </span>
          <MinOrderBadge minOrderAmount={promo.minOrderAmount} />
          <ExpiryBadge validUntil={promo.endAt} />
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`p-2 rounded-lg transition ${
          copied
            ? "bg-green-100 text-green-600"
            : "bg-white border text-orange-500 hover:bg-orange-100"
        }`}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </motion.div>
  );
}

/* ── Main Modal ── */

export default function PromoCodeModal({ isOpen, onClose, promos = [] }) {
  const [showOffers, setShowOffers] = useState(false);
  const { slug } = useParams();

  const validPromos = promos.filter((p) => getDaysLeft(p.endAt) > 0);

  // Lock body scroll when either modal is open
  useEffect(() => {
    document.body.style.overflow = (isOpen || showOffers) ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset" };
  }, [isOpen, showOffers]);

  // ── "View All Offers" — close this modal and open Offers
  const handleViewAllOffers = () => {
    onClose();           // close PromoCodeModal via parent state
    setShowOffers(true); // open Offers independently
  };

  return (
    <>
      {/* ── PromoCodeModal — controlled by parent isOpen */}
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

            {/* Modal */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="
                fixed z-50 bg-white shadow-2xl overflow-hidden
                bottom-0 left-0 right-0 rounded-t-3xl
                sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto
                sm:-translate-x-1/2 sm:-translate-y-1/2
                sm:rounded-3xl sm:w-[90%] sm:max-w-lg
                lg:max-w-2xl
              "
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Tag size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Special Offers</h2>
                      <p className="text-xs opacity-90">{validPromos.length} available</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="bg-white/20 p-1.5 rounded-lg">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Promo list */}
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {validPromos.length > 0 ? (
                  validPromos.map((promo, i) => (
                    <PromoCardModal key={i} promo={promo} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 text-gray-400">
                    <Tag size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No active offers right now</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t p-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleViewAllOffers}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl shadow text-sm font-semibold"
                >
                  View All Offers
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Offers — controlled independently so it survives PromoCodeModal closing */}
      <Offers
        isOpen={showOffers}
        onClose={() => setShowOffers(false)}
        slug={slug}
      />
    </>
  );
}