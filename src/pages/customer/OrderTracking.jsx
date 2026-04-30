import React from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  ChefHat,
  Bell,
  PackageCheck,
  Utensils,
} from "lucide-react";

const OrderTracking = () => {
  // In a real MERN app, 'status' would come from your MongoDB via Socket.io
  const orderStatus = "Preparing";

  const steps = [
    {
      id: 1,
      label: "Order Placed",
      time: "Today, 1:20 PM",
      icon: <Clock size={16} />,
      completed: true,
    },
    {
      id: 2,
      label: "Confirmed",
      time: "Today, 1:21 PM",
      icon: <Check size={16} />,
      completed: true,
    },
    {
      id: 3,
      label: "Preparing",
      time: "Your food is being prepared",
      icon: <ChefHat size={16} />,
      completed: false,
      active: true,
    },
    {
      id: 4,
      label: "Ready",
      time: "Waiting to be served",
      icon: <Utensils size={16} />,
      completed: false,
    },
    {
      id: 5,
      label: "Completed",
      time: "Enjoy your meal!",
      icon: <PackageCheck size={16} />,
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white z-10">
        <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
          Order Tracking
        </h1>
        <div className="w-10"></div> {/* Placeholder to center the title */}
      </header>

      <div className="p-8 flex flex-col items-center">
        {/* Order Info Card */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Order #1024
          </p>
          <h2 className="text-xl font-bold text-gray-800">Table 05</h2>

          <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-5 py-2 rounded-full text-xs font-bold border border-orange-100 animate-pulse">
            <ChefHat size={14} /> Preparing
          </div>
        </div>

        {/* Timeline Container */}
        <div className="w-full max-w-xs relative ml-4">
          {/* Main Vertical Track */}
          <div className="absolute left-4.75 top-2 bottom-2 w-0.5 bg-gray-100"></div>

          <div className="space-y-12">
            {steps.map((step) => (
              <div key={step.id} className="relative flex items-start gap-6">
                {/* Step Circle */}
                <div
                  className={`z-10 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-500
                  ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : step.active
                        ? "bg-orange-500 text-white scale-110 ring-4 ring-orange-100"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.completed ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step Text Content */}
                <div className="flex-1 pt-1">
                  <h4
                    className={`text-sm font-bold transition-colors ${step.active ? "text-gray-900" : step.completed ? "text-gray-800" : "text-gray-400"}`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    {step.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Alert Box */}
        <div className="mt-16 w-full max-w-sm bg-orange-50 p-6 rounded-4xl flex items-center gap-5 border border-orange-100 shadow-sm shadow-orange-50">
          <div className="p-4 bg-white rounded-2xl shadow-sm text-orange-500">
            <Bell size={24} className="animate-bounce" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">
              We will notify you
            </p>
            <p className="text-[11px] text-gray-500 leading-normal">
              Your order is being handled with care and will be ready shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
