import React from 'react';
import { 
  User, 
  ShoppingBag, 
  Tag, 
  PhoneCall, 
  MessageSquare, 
  Info, 
  FileText, 
  ChevronRight,
  Home,
  Menu as MenuIcon,
  LogOut
} from 'lucide-react';
import Navigation from '../../components/customer/Navigation';

const AccountPage = () => {
  const menuItems = [
    { icon: <User size={20} />, label: "Profile", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: <ShoppingBag size={20} />, label: "My Orders", color: "text-orange-500", bg: "bg-orange-50" },
    { icon: <Tag size={20} />, label: "Offers & Deals", color: "text-red-500", bg: "bg-red-50" },
    { icon: <PhoneCall size={20} />, label: "Call Waiter", color: "text-green-500", bg: "bg-green-50" },
    { icon: <MessageSquare size={20} />, label: "Feedback", color: "text-purple-500", bg: "bg-purple-50" },
    { icon: <Info size={20} />, label: "About Us", color: "text-cyan-500", bg: "bg-cyan-50" },
    { icon: <FileText size={20} />, label: "Terms & Conditions", color: "text-gray-500", bg: "bg-gray-50" },
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 text-center border-b border-gray-50 sticky top-0 bg-white z-10">
        <h1 className="text-xl font-black text-gray-800 tracking-tight">More</h1>
      </header>

      {/* Profile Header (Optional addition for MERN) */}
      <div className="px-6 py-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-3 border-4 border-white shadow-sm">
          <User size={40} />
        </div>
        <h2 className="font-bold text-gray-800">Guest User</h2>
        <p className="text-[10px] text-gray-400 font-medium">Table 05 • Foodies Cafe</p>
      </div>

      {/* Menu List */}
      <div className="px-6 space-y-2">
        {menuItems.map((item, index) => (
          <button 
            key={index}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all group border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 ${item.bg} ${item.color} rounded-xl`}>
                {item.icon}
              </div>
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}

        {/* Logout / Exit Session */}
        <button className="w-full flex items-center gap-4 p-4 mt-4 text-red-500 opacity-80 hover:opacity-100">
           <div className="p-2.5 bg-red-50 rounded-xl">
              <LogOut size={20} />
           </div>
           <span className="text-sm font-bold">Exit Session</span>
        </button>
      </div>

     {/* Nav */}
     <Navigation />
    </div>
  );
};

export default AccountPage;