import { useState, useEffect } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { X, MessageCircle, Star } from "lucide-react";
import MessageBox from "./MessageBox";

// Static waiter data; replace with API: GET /api/restaurant/employees?role=waiter
const WAITERS_DATA = [
  {
    id: 1,
    name: "Rahul Kumar",
    role: "Senior Waiter",
    avatar: "👨‍🍳",
    rating: 4.8,
    orders: 234,
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Waiter",
    avatar: "👩‍🍳",
    rating: 4.9,
    orders: 189,
  },
  {
    id: 3,
    name: "Amit Singh",
    role: "Waiter",
    avatar: "👨‍🍳",
    rating: 4.7,
    orders: 156,
  },
  {
    id: 4,
    name: "Sita Devi",
    role: "Senior Waiter",
    avatar: "👩‍🍳",
    rating: 4.8,
    orders: 201,
  },
  {
    id: 5,
    name: "Raj Patel",
    role: "Waiter",
    avatar: "👨‍🍳",
    rating: 4.6,
    orders: 98,
  },
];

export default function Waiters({ isOpen, onClose }) {
  const [activeWaiter, setActiveWaiter] = useState(null);

  // Lock body scroll when sheet or chat is open
  useEffect(() => {
    document.body.style.overflow = isOpen || activeWaiter ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, activeWaiter]);

  return (
    <>
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

            {/* Bottom sheet */}
            <m.div
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
              <div className="bg-orange-500 mx-4 mt-4 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Waiters</h2>
                    <p className="text-sm opacity-90">
                      Select a waiter to message
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Waiter list */}
              <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
                {WAITERS_DATA.map((waiter) => (
                  <div
                    key={waiter.id}
                    className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center text-xl flex-0">
                      {waiter.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {waiter.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {waiter.role}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star
                          size={10}
                          className="text-orange-400 fill-orange-400"
                        />
                        <span className="text-xs text-gray-400">
                          {waiter.rating}
                        </span>
                        <span className="text-xs text-gray-300 mx-1">·</span>
                        <span className="text-xs text-gray-400">
                          {waiter.orders} orders
                        </span>
                      </div>
                    </div>

                    {/* Message button */}
                    <button
                      onClick={() => setActiveWaiter(waiter)}
                      className="bg-green-500 hover:bg-green-600 active:scale-95 p-2 rounded-xl text-white transition-all"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </m.div>
            </>
          )}
        </AnimatePresence>
      </LazyMotion>

      {/* MessageBox rendered outside sheet so it layers above everything */}
      <MessageBox waiter={activeWaiter} onClose={() => setActiveWaiter(null)} />
    </>
  );
}
