// Vite + React + TailwindCSS - FULL RESPONSIVE HOMEPAGE (LIKE DESIGN)

import React, { useState, useEffect } from "react";
import {
  Phone,
  Tag,
  MessageSquare,
  Menu,
  User,
  ShoppingBag,
  HomeIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../../components/customer/Navigation";
import SideBar from "../../../components/customer/homepage/SideBar";
import UserProfile from "../../../components/customer/homepage/UserProfile";
import Waiters from "../../../components/customer/homepage/Waiters";
import QRScannerModal from "../../../components/customer/homepage/QRScannerModal";
import Offers from "../../../components/customer/homepage/Offers";
import Feedback from "../../../components/customer/homepage/Feedback";
import PageTransition from '../../../components/customer/PageTransition';
import api from "../../../services/api";
import toast from "react-hot-toast";


export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showWaiters, setShowWaiters] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const { token } = useParams();
  const {restaurantSlug} = useParams();
  
  


 

  const handleScanSuccess = (data) => {
    console.log("QR Data Scanned:", data);
    // Usually, 'data' is a URL. You can parse it to find the table number.
    // Example: if data is 'https://mycafe.com/table/08', redirect there.
    alert(`Scanned: ${data}`);
  };

  useEffect(()=>{
    fetchTables();
  },[])

    const fetchTables = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/restaurant/tables/qr/${token}`)
        // console.log('Tables response:', res.data.data.tableNumber)
        setTableNumber(res.data.data.tableNumber)
        // setTables(res.data.data || [])
      } catch (error) {
        console.error('Failed to fetch tables:', error)
        toast.error('Failed to fetch tables')
        // setTables([])
      } finally {
        setLoading(false)
      }
    }

  // if (isLoading) {
  //   return <Loader />;
  // }

// let userId = localStorage.getItem("guest_id");

// if (!userId) {
//   userId = "guest_" + Date.now() + Math.random().toString(36).substr(2, 9);
//   localStorage.setItem("guest_id", userId);
// }



  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-24 font-sans">
      {/* Hero Section with Background Image */}
      <div
        className="relative w-full h-[45vh] bg-cover bg-center flex flex-col items-center justify-center text-white p-6"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80')`,
        }}
      >
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between z-20">
          {/* Left: Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/30 text-white active:scale-90 transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Right: Profile Access */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/30 text-white active:scale-90 transition-all"
          >
            <User size={20} />
          </button>
        </div>

        <div className="text-center">
          <div className="bg-white/20 backdrop-blur-md inline-block p-3 rounded-full mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{JSON.parse(localStorage.getItem("user")).name}</h1>
          {/* <h1 className="text-3xl font-bold tracking-tight">Foodies Cafe 🌿</h1> */}
          <p className="text-sm opacity-90 mt-2 italic">
            Delicious food, served with love
          </p>
        </div>
      </div>

      {/* Table Selection Card */}
      <div className="relative -mt-16 w-[90%] max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
        <p className="text-gray-500 font-medium text-sm">Table No.</p>
        <h2 className="text-6xl font-black text-orange-500 my-2">{tableNumber.toUpperCase()}</h2>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-2 text-gray-400 text-xs mt-2 hover:text-orange-500 transition-colors"
        >
          <span className="rotate-180">🔄</span> Scan another QR code
        </button>
        <Link
          to={`/menu/${JSON.parse(localStorage.getItem("user")).slug}/${token}`}
          className="w-48 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl mt-8 shadow-lg shadow-orange-200 transition-all active:scale-95"
        >
          View Menu
        </Link>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-4 w-[90%] max-w-md mt-8">
        <button
          onClick={() => setShowWaiters(true)}
          className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50 active:bg-gray-100"
        >
          <div className="bg-orange-50 p-3 rounded-full text-orange-500 mb-2">
            <Phone size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">
            Call Waiter
          </span>
        </button>

        <button 
          onClick={() => setShowOffers(true)}
          className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50 active:bg-gray-100"
        >
          <div className="bg-orange-50 p-3 rounded-full text-orange-500 mb-2">
            <Tag size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Offers</span>
        </button>

        <button 
          onClick={() => setShowFeedback(true)}
          className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50 active:bg-gray-100"
        >
          <div className="bg-orange-50 p-3 rounded-full text-orange-500 mb-2">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Feedback</span>
        </button>
      </div>

      {/* Branding Footer */}
      <p className="mt-12 text-gray-400 text-xs">
        Powered by{" "}
        <span className="font-bold text-gray-600 uppercase tracking-widest text-[10px]">
          Foodies Cafe
        </span>{" "}
        ❤️
      </p>

      {/* Sidebar & Profile Components */}
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <Waiters isOpen={showWaiters} onClose={() => setShowWaiters(false)} />
      <Offers isOpen={showOffers} onClose={() => setShowOffers(false)} />
      <Feedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
      {/* Nav */}

      {/* <Navigation /> */}
    </div>
     </PageTransition>
  );
}
