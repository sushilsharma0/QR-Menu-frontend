import React from 'react';
import { ArrowLeft, PhoneCall, RefreshCcw, Info, MapPin } from 'lucide-react';

const TableInfo = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-10">
      {/* Header */}
      <header className="border-b border-gray-50 px-6 pb-6 pt-12">
        <div className="mx-auto flex w-full max-w-4xl items-center">
        <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-800">Table Information</h1>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-4xl items-center gap-10 px-8 pt-12 text-center md:grid-cols-2">
        {/* Illustration Section */}
        <div className="relative mb-10">
          <div className="w-64 h-64 bg-orange-50 rounded-full flex items-center justify-center">
            {/* Minimalist Table Illustration using SVG/Lucide */}
            <div className="relative">
               <div className="w-20 h-1 bg-gray-300 rounded-full mb-6"></div> {/* Table top */}
               <div className="flex gap-10">
                  <div className="w-1.5 h-12 bg-gray-200 rounded-full"></div> {/* Leg 1 */}
                  <div className="w-1.5 h-12 bg-gray-200 rounded-full"></div> {/* Leg 2 */}
               </div>
               {/* Floating "Chair" elements */}
               <div className="absolute -left-8 top-4 w-4 h-8 bg-orange-200 rounded-t-lg opacity-50"></div>
               <div className="absolute -right-8 top-4 w-4 h-8 bg-orange-200 rounded-t-lg opacity-50"></div>
            </div>
          </div>
          {/* Table Badge */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white px-6 py-2 rounded-2xl shadow-lg border border-orange-100">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Table</span>
          </div>
        </div>

        {/* Table Number Display */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-400">You are sitting at</p>
          <h2 className="text-7xl font-semibold text-orange-500 my-2">05</h2>
          
          <button className="flex items-center gap-2 text-gray-400 text-[11px] font-bold hover:text-orange-500 transition-colors mx-auto uppercase tracking-wider">
            <RefreshCcw size={12} /> Scan another QR code
          </button>
        </div>

        {/* Assistance Card */}
        <div className="relative mt-12 w-full overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50/50 p-6 md:col-span-2">
          {/* Subtle Background Pattern */}
          <div className="absolute -right-4 -top-4 text-orange-100 rotate-12">
            <Info size={120} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
               <MapPin size={14} className="text-orange-500" />
               <h3 className="font-semibold text-gray-800">Need help?</h3>
            </div>
            <p className="text-xs text-gray-500 mb-6 max-w-50">
              Our staff is here to assist you. Tap the button below to call a waiter to Table 05.
            </p>
            
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-200 active:scale-95 transition-all">
              <PhoneCall size={20} />
              Call Waiter
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-[10px] font-medium text-gray-300 md:col-span-2">
          Foodies Cafe • Restaurant ID: #FC-9921
        </p>
      </div>
    </div>
  );
};

export default TableInfo;
