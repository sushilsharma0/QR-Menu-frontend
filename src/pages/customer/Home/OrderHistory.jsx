import React from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  ChevronRight,
  Hash,
} from "lucide-react";

const OrderHistory = () => {
  const orders = [
    {
      id: "FC-5521",
      date: "Today, 12:40 PM",
      status: "Preparing",
      items: ["Creamy Alfredo Pasta x1", "Mango Shake x2"],
      total: "850",
      isRecent: true,
    },
    {
      id: "FC-4412",
      date: "22 April, 08:15 PM",
      status: "Completed",
      items: ["Grilled Chicken Sandwich x1", "Coke x1"],
      total: "520",
      isRecent: false,
    },
    {
      id: "FC-3301",
      date: "15 April, 01:30 PM",
      status: "Completed",
      items: ["Veg Platter x1"],
      total: "1200",
      isRecent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => window.history.back()}>
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="ml-4 text-xl font-black text-gray-800">Order History</h1>
      </header>

      <div className="p-6 space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="relative">
            {/* Recent Order Indicator */}
            {order.isRecent && (
              <div className="absolute -top-3 right-4 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-orange-200 z-10 animate-pulse">
                LATEST
              </div>
            )}

            <div
              className={`bg-white border ${order.isRecent ? "border-orange-100 shadow-xl shadow-orange-50/50" : "border-gray-100 shadow-sm"} rounded-4xl p-6`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Hash size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {order.id}
                    </span>
                    <p className="text-[11px] font-bold text-gray-400">
                      {order.date}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${order.status === "Preparing" ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500"}`}
                >
                  {order.status === "Preparing" ? (
                    <Clock size={12} strokeWidth={3} />
                  ) : (
                    <CheckCircle2 size={12} strokeWidth={3} />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2 mb-5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-700">{item}</p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-100 pt-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter mb-0.5">
                    Grand Total
                  </p>
                  <p className="text-xl font-black text-gray-800">
                    <span className="text-orange-500 text-sm mr-1">Rs</span>
                    {order.total}
                  </p>
                </div>

                <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl text-[11px] font-bold active:scale-95 transition-all shadow-lg shadow-gray-200">
                  Reorder <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Support Link */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-400 font-medium">
            Having trouble with an order?{" "}
            <span className="text-orange-500 font-bold">Help Center</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
