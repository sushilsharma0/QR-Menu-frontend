import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSmartphone, FiZap, FiWifi, FiStar, FiChevronRight, 
  FiMapPin, FiClock, FiPlus, FiCheckCircle, FiTrendingUp,
  FiLayout, FiShield, FiSend
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- STYLES ---
const styles = {
  glass: "bg-white/80 backdrop-blur-md border border-white/20 shadow-xl",
  gradientText: "bg-clip-text text-transparent bg-gradient-to-r from-secondary-500 to-primary-500",
  section: "py-24 px-6 max-w-7xl mx-auto",
};

// --- MOCK DATA ---
const RESTAURANTS = [
  { id: 1, name: "Urban Bistro", category: "Fine Dining", rating: 4.8, img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400", tags: ["Contactless", "Fast"] },
  { id: 2, name: "Pizza Heaven", category: "Fast Food", rating: 4.5, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400", tags: ["Rewards", "Veg"] },
  { id: 3, name: "Sushi Zen", category: "Japanese", rating: 4.9, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400", tags: ["Fresh", "QR-Pay"] },
];

const FEATURES = [
  { icon: <FiZap />, title: "Instant QR Entry", desc: "Scan and start browsing. No app downloads or account creation required." },
  { icon: <FiWifi />, title: "Offline Sync", desc: "Place orders even with spotty Wi-Fi. We sync automatically when you're back." },
  { icon: <FiShield />, title: "Safe & Secure", desc: "Encrypted guest IDs and secure payment gateways for peace of mind." },
  { icon: <FiLayout />, title: "Waiter Call", desc: "Need assistance? Call a waiter to your specific table with one tap." },
];


const THEME = {
  primary: "#8f2800",
  primaryLight: "#b64a26",
  secondary: "#b64a26",
  accent: "#756a03",
  attention: "#a69b02",
  bg: "#feefa5",
  text: "#8f2800",
  textMuted: "#756a03",
};

const CAROUSEL_IMAGES = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    title: "Luxury Dining"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    title: "Modern Restaurants"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800",
    title: "Fine Experience"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&q=80&w=800",
    title: "Cozy Ambience"
  },
];
export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [formData, setFormData] = useState({ name: "", comment: "", rating: 5 });
  const [submitted, setSubmitted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  // --- 1. AUTO-PLAY LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
  
    return () => clearInterval(interval);
  }, []);

  // --- 2. GSAP SHUFFLE ANIMATION ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".active-card",
        { x: 0, opacity: 1, scale: 1, rotation: 0 },
        {
          x: 120,
          opacity: 0,
          scale: 0.85,
          rotation: 8,
          duration: 0.5,
          ease: "power2.inOut"
        }
      );
    }, carouselRef);
  
    return () => ctx.revert(); // CLEANUP
  }, [currentIndex]);

  
  return (
    <div className="bg-surface-50 text-primary-900 font-sans selection:bg-surface-200">
      
      {/* 1. NAV BAR */}
      <nav className="fixed top-0 w-full z-50 py-4 px-8 flex justify-between items-center bg-white/70 backdrop-blur-md border-b">
        <div className="text-2xl font-black italic text-primary-500">QUICKBITE.</div>
        <div className="hidden md:flex gap-8 font-medium">
          <a href="#features" className="hover:text-primary-500 transition-colors">Features</a>
          <a href="#restaurants" className="hover:text-primary-500 transition-colors">Restaurants</a>
          <a href="#feedback" className="hover:text-primary-500 transition-colors">Feedback</a>
        </div>
        <Link to="/login" className="bg-primary-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-secondary-200 hover:scale-105 transition-transform">
          Admin Login
        </Link>
      </nav>

      
      {/* 2. HERO SECTION WITH GSAP CAROUSEL */}
      <section className="pt-32 pb-20 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Content */}
        <div>
          <h1 className="text-7xl font-black mb-6">
            Fast Food. <br />
            <span style={{ color: THEME.primary }}>Faster Tech.</span>
          </h1>
          <p className="text-lg mb-10" style={{ color: THEME.textMuted }}>
            Automatic updates, real-time syncing, and a beautiful interface 
            designed for the modern diner.
          </p>
          <button className="bg-primary-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
            Get Started <FiChevronRight />
          </button>
        </div>

        {/* Right Side: Auto-Playing Stacked Carousel */}
        <div ref={carouselRef} className="relative h-[450px] w-full flex items-center justify-center">
        {CAROUSEL_IMAGES.map((img, i) => {
  const position = (i - currentIndex + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
  const isTop = position === 0;

  return (
    <div
      key={img.id}
      className={`carousel-card absolute w-72 h-96 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white transition-all duration-700 ${
        isTop ? "active-card" : ""
      }`}
      style={{
        zIndex: CAROUSEL_IMAGES.length - position,
        transform: `
          translateX(${position * 25}px)
          translateY(${position * -15}px)
          rotate(${position * 3}deg)
          scale(${1 - position * 0.07})
        `,
        opacity: position > 3 ? 0 : 1,
      }}
    >
      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />

      {isTop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl"
        >
          <p className="text-xs font-black text-primary-500 uppercase">Featured</p>
          <h3 className="font-bold">{img.title}</h3>
        </motion.div>
      )}
    </div>
  );
})}

          {/* Background Glow */}
          <div className="absolute -z-10 w-80 h-80 bg-secondary-200 blur-[100px] rounded-full opacity-50" />
        </div>

      </section>

      {/* 3. FEATURES GRID */}
      <section id="features" className="bg-white py-24">
        <div className={styles.section}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Smart Features for Modern Tables</h2>
            <p className="text-accent-700 mt-4">Everything you need to run a 5-star digital restaurant.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div 
                whileHover={{ y: -10 }}
                key={i} 
                className="p-8 rounded-3xl border border-surface-200 hover:border-secondary-200 hover:shadow-xl hover:shadow-secondary-100/50 transition-all group"
              >
                <div className="w-14 h-14 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-accent-700 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RESTAURANT BROWSER */}
      <section id="restaurants" className={styles.section}>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold">Trusted by Top Kitchens</h2>
            <p className="text-accent-700 mt-2">Discover local favorites using QuickBite.</p>
          </div>
          <div className="flex bg-surface-200 p-1 rounded-xl">
            {["All", "Fast Food", "Fine Dining", "Japanese"].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeCategory === cat ? 'bg-white shadow-sm' : 'text-accent-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <AnimatePresence mode='popLayout'>
            {RESTAURANTS.filter(r => activeCategory === "All" || r.category === activeCategory).map((r) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={r.id} 
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  <img src={r.img} alt={r.name} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <FiStar className="fill-attention-500 text-attention-500" /> {r.rating}
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{r.name}</h3>
                    <p className="text-accent-700 text-sm">{r.category}</p>
                  </div>
                  <div className="flex gap-2">
                    {r.tags.map(t => (
                      <span key={t} className="text-[10px] bg-surface-100 px-2 py-1 rounded-md font-bold uppercase tracking-wider text-accent-700">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* 5. LIVE STATS */}
      <section className="bg-primary-900 py-20 my-20">
        <div className={styles.section + " grid grid-cols-2 lg:grid-cols-4 gap-12 text-center"}>
          {[
            { label: "Daily Orders", val: "12k+", icon: <FiTrendingUp /> },
            { label: "Restaurants", val: "500+", icon: <FiCheckCircle /> },
            { label: "Happy Diners", val: "1M+", icon: <FiStar /> },
            { label: "Wait Time Saved", val: "3.5y", icon: <FiClock /> },
          ].map((s, i) => (
            <div key={i} className="text-white">
              <div className="text-secondary-300 text-3xl mb-4 flex justify-center">{s.icon}</div>
              <div className="text-4xl font-black mb-1">{s.val}</div>
              <div className="text-surface-200 text-sm uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FEEDBACK SYSTEM */}
      <section id="feedback" className={styles.section}>
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">We Value Your Experience</h2>
            <p className="text-accent-700 mb-8">QuickBite evolves through your feedback. Share your dining experience and help us make every meal better.</p>
            
            <div className="space-y-6">
              {[
                { name: "Jessica R.", comment: "Orders are so much faster now. Love not having to wait for the bill!" },
                { name: "Marco V.", comment: "The UI is buttery smooth. Best contactless system I've used so far." },
              ].map((rev, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border-l-4 border-primary-500 shadow-sm">
                  <p className="italic text-accent-700 mb-2">"{rev.comment}"</p>
                  <p className="font-bold text-sm text-primary-900">— {rev.name}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            whileHover={{ rotate: 1 }}
            className={`p-10 rounded-[2.5rem] ${styles.glass}`}
          >
            {!submitted ? (
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-tight">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full bg-surface-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-tight">How was the food?</label>
                  <textarea 
                    rows="4" 
                    placeholder="Tell us everything..." 
                    className="w-full bg-surface-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-4 uppercase tracking-tight">Rating</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FiStar 
                        key={star} 
                        onClick={() => setFormData({...formData, rating: star})}
                        className={`text-2xl cursor-pointer transition-colors ${formData.rating >= star ? 'fill-attention-500 text-attention-500' : 'text-surface-400'}`} 
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-secondary-200 flex items-center justify-center gap-2">
                  Send Feedback <FiSend />
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-6xl text-accent-500 mb-6 flex justify-center"><FiCheckCircle /></div>
                <h3 className="text-2xl font-bold mb-2">Thank you!</h3>
                <p className="text-accent-700">Your feedback has been successfully shared.</p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-primary-500 font-bold underline">Send another</button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-surface-50 border-t py-16">
        <div className={styles.section + " flex flex-col md:flex-row justify-between items-center gap-10"}>
          <div>
            <div className="text-2xl font-black text-primary-500 mb-4">QUICKBITE.</div>
            <p className="text-accent-700 max-w-xs text-sm">Empowering restaurants to deliver contactless excellence since 2024.</p>
          </div>
          <div className="flex gap-10 text-sm font-bold">
            <div className="space-y-4">
              <p className="uppercase text-accent-500 tracking-widest text-[10px]">Product</p>
              <a href="#" className="block hover:text-primary-500">For Restaurants</a>
              <a href="#" className="block hover:text-primary-500">Order System</a>
            </div>
            <div className="space-y-4">
              <p className="uppercase text-accent-500 tracking-widest text-[10px]">Company</p>
              <a href="#" className="block hover:text-primary-500">Privacy Policy</a>
              <a href="#" className="block hover:text-primary-500">Contact Us</a>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white border rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white cursor-pointer transition-colors"><FiSmartphone /></div>
            <div className="w-10 h-10 bg-white border rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white cursor-pointer transition-colors"><FiZap /></div>
          </div>
        </div>
        <div className="text-center text-accent-500 text-xs mt-12">
          &copy; 2024 QuickBite Technologies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}