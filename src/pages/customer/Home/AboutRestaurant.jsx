import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Utensils,
  Award,
  Heart,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const restaurantInfo = {
  name: "Foodies Cafe",
  tagline: "Delicious food, served with love",
  description:
    "Welcome to Foodies Cafe, where we serve the most authentic and delicious cuisine in town. Our chefs use only the freshest ingredients to create mouth-watering dishes that will leave you wanting more.",
  rating: 4.8,
  reviews: 234,
  established: 2018,
  cuisine: "Multi-cuisine",
  priceRange: "₹₹",
  address: "123 Food Street, Culinary District, City - 400001",
  phone: "+91 98765 43210",
  email: "info@foodiescafe.com",
  hours: {
    monday: "9:00 AM - 10:00 PM",
    tuesday: "9:00 AM - 10:00 PM",
    wednesday: "9:00 AM - 10:00 PM",
    thursday: "9:00 AM - 10:00 PM",
    friday: "9:00 AM - 11:00 PM",
    saturday: "10:00 AM - 11:00 PM",
    sunday: "10:00 AM - 9:00 PM",
  },
  features: [
    { icon: Utensils, label: "Fresh Ingredients" },
    { icon: Award, label: "Best Service" },
    { icon: Heart, label: "Hygienic" },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&q=80",
  ],
};

export default function AboutRestaurant() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Image */}
      <div
        className="h-48 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80')`,
        }}
      >
        <Link
          to="/"
          className="absolute text-white top-4 z-10 left-4 bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          <X size={20} />
        </Link>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-5xl mb-3">🍽️</div>
            <h1 className="text-3xl font-black">{restaurantInfo.name}</h1>
            <p className="text-sm opacity-90 mt-1">{restaurantInfo.tagline}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Rating & Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-gray-800">
                  {restaurantInfo.rating}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({restaurantInfo.reviews} reviews)
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Since {restaurantInfo.established}
            </div>
          </div>
        </div>

        {/* About Description */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-2">About Us</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {restaurantInfo.description}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-orange-500">
                {restaurantInfo.cuisine}
              </p>
              <p className="text-xs text-gray-500">Cuisine</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-500">
                {restaurantInfo.priceRange}
              </p>
              <p className="text-xs text-gray-500">Price</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            {restaurantInfo.features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <feature.icon size={20} className="text-orange-500" />
                </div>
                <p className="text-xs font-bold text-gray-700">
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Contact Us</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <MapPin size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-bold text-gray-800">
                  {restaurantInfo.address}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Phone size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-bold text-gray-800">
                  {restaurantInfo.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Mail size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-bold text-gray-800">
                  {restaurantInfo.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800">Opening Hours</h2>
          </div>

          <div className="space-y-2">
            {Object.entries(restaurantInfo.hours).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-sm">
                <span className="capitalize text-gray-600">{day}</span>
                <span className="font-bold text-gray-800">{hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Gallery</h2>
          <div className="grid grid-cols-2 gap-2">
            {restaurantInfo.gallery.map((image, index) => (
              <div
                key={index}
                className="h-24 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url('${image}')` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
