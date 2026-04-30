import React, { useState } from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState("Current");
  // const [showTracking, setShowTracking] = useState(false);
  const navigate = useNavigate();
  // Mock data for the timeline
  const orderSteps = [
    { status: "Order Placed", time: "1:20 PM", done: true },
    { status: "Confirmed", time: "1:21 PM", done: true },
    { status: "Preparing", time: "Processing...", done: false, active: true },
    { status: "Ready", time: "Waiting...", done: false },
    { status: "Completed", time: "Enjoy!", done: false },
  ];

  // if (showTracking) {
  //   return (
  //     <div className="min-h-screen bg-white pb-10">
  //       {/* Tracking Header */}
  //       <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-gray-50">
  //         <button onClick={() => setShowTracking(false)} className="p-2 bg-gray-50 rounded-xl">
  //           <ArrowLeft size={20} />
  //         </button>
  //         <h1 className="text-lg font-bold text-gray-800">Order Tracking</h1>
  //         <div className="w-10"></div> {/* Spacer */}
  //       </header>

  //       <div className="p-8 flex flex-col items-center">
  //         <div className="text-center mb-8">
  //           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Order #1024</p>
  //           <h2 className="text-sm font-bold text-gray-800">Table 05</h2>
  //           <div className="inline-flex items-center gap-2 mt-3 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
  //             <ChefHat size={14} /> Preparing
  //           </div>
  //         </div>

  //         {/* Vertical Timeline */}
  //         <div className="w-full max-w-xs relative pl-8">
  //           {/* The Vertical Line */}
  //           <div className="absolute left-9.75 top-2 bottom-2 w-0.5 bg-gray-100"></div>

  //           <div className="space-y-12">
  //             {orderSteps.map((step, index) => (
  //               <div key={index} className="relative flex items-center gap-6">
  //                 {/* Step Indicator */}
  //                 <div className={`z-10 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center
  //                   ${step.done ? 'bg-green-500' : step.active ? 'bg-orange-500 scale-125' : 'bg-gray-200'}`}>
  //                   {step.done && <CheckCircle2 size={12} className="text-white" />}
  //                 </div>

  //                 {/* Step Text */}
  //                 <div className="flex-1">
  //                   <h4 className={`text-sm font-bold ${step.active ? 'text-gray-900' : 'text-gray-500'}`}>
  //                     {step.status}
  //                   </h4>
  //                   <p className="text-[11px] text-gray-400">{step.time}</p>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>

  //         {/* Notification Prompt */}
  //         <div className="mt-16 w-full bg-orange-50 p-6 rounded-3xl flex items-center gap-4 border border-orange-100">
  //           <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-500">
  //             <Bell size={24} />
  //           </div>
  //           <div>
  //             <p className="text-xs font-bold text-gray-800">Stay Updated</p>
  //             <p className="text-[10px] text-gray-500">We will notify you when your order is ready.</p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* List Header */}
      <header className="px-6 pt-12 pb-4 flex items-center gap-4">
        <button
          className="p-2 bg-gray-50 rounded-xl hover:bg-red-300 transition-colors"
          onClick={() => navigate(-1) || navigate("/")}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">My Orders</h1>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2">
        {["Current", "Past"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="px-6 mt-4 space-y-6">
        <div className="border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Order #1024</h3>
              <p className="text-xs text-gray-400">Table 05 • Today, 1:20 PM</p>
            </div>
            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
              Preparing
            </span>
          </div>

          <div className="space-y-2 border-b border-gray-50 pb-4 mb-4">
            <p className="text-xs text-gray-600">
              Creamy Alfredo Pasta x1{" "}
              <span className="float-right font-bold text-gray-800">
                Rs. 450
              </span>
            </p>
            <p className="text-xs text-gray-600">
              Chicken Wings x1{" "}
              <span className="float-right font-bold text-gray-800">
                Rs. 350
              </span>
            </p>
            <p className="text-xs text-gray-600">
              French Fries x1{" "}
              <span className="float-right font-bold text-gray-800">
                Rs. 220
              </span>
            </p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-black text-orange-500">Rs. 1,071</span>
          </div>

          <button className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 transition-all">
            View Order Details <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default MyOrders;
