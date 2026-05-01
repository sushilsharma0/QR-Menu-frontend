import React, { useState, useEffect } from "react";
import * as FramerMotion from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Plus,
  Minus,
  Heart,
  Star,
  Clock,
  Flame,
  ShoppingCart,
  Check,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";

const ItemDetails = () => {
  const navigate = useNavigate();
  const { slug, token, id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const [isFavorite, setIsFavorite] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);

  // const item = {
  //   name: "Creamy Alfredo Pasta",
  //   price: 450,
  //   originalPrice: 499,
  //   desc: "Classic pasta in white cream sauce with parmesan cheese and herbs. Made with fresh ingredients and authentic Italian recipe passed down through generations.",
  //   tag: "Veg",
  //   img: "https://images.immediate.co.uk/production/volatile/sites/30/2022/08/Alfredo-dc662e3.jpg",
  //   rating: 4.5,
  //   reviews: 128,
  //   prepTime: "20-25 min",
  //   calories: 420,
  //   isBestseller: true,
  // };

  const [item, setItem] = useState({});

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      // Pass slug as query param for public access
      const res = await api.get(
        `/restaurant/menu/items/${id}?restaurantSlug=${slug}`,
      );
      setItem(res.data.data);
      console.log(res.data.data);
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  };
  const addons = [
    {
      id: "a1",
      name: "Grilled Chicken",
      price: 120,
      description: "Tender grilled chicken pieces",
    },
    {
      id: "a2",
      name: "Extra Cheese",
      price: 80,
      description: "Loaded with mozzarella",
    },
    {
      id: "a3",
      name: "Mushrooms",
      price: 90,
      description: "Fresh button mushrooms",
    },
    { id: "a4", name: "Olives", price: 70, description: "Black olives" },
  ];

  const nutritionalInfo = [
    { label: "Protein", value: "18g" },
    { label: "Carbs", value: "52g" },
    { label: "Fat", value: "16g" },
    { label: "Fiber", value: "3g" },
  ];

  const toggleAddon = (id) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const calculateTotal = () => {
    const addonsTotal = addons
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
    return (item.price + addonsTotal) * quantity;
  };

  // const handleAddToCart = () => {
  //   setShowAddedToast(true);
  //   setTimeout(() => setShowAddedToast(false), 2000);
  // };


  const handleAddToCart = async () => {
    try {
      // Get restaurant by slug to get the restaurant ID
      const restaurantRes = await api.get(`/restaurant/menu/public/${slug}`);
      const restaurant = restaurantRes.data.data;
      
      // Prepare the cart item with all necessary details
      const cartItem = {
        _id: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: quantity,
        restaurantId: restaurant._id,
        addons: addons.filter(a => selectedAddons.includes(a.id)).map(addon => ({
          name: addon.name,
          price: addon.price
        })),
        totalPrice: calculateTotal()
      };

      // Get existing cart from localStorage
      let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0, restaurantId: null };

      // Check if adding from a different restaurant
      if (cart.restaurantId && cart.restaurantId !== restaurant._id) {
        if (!window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
          return;
        }
        cart = { items: [], total: 0, restaurantId: null };
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(i => i._id === item._id);
      
      if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.items.push(cartItem);
      }

      // Recalculate total
      cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      cart.restaurantId = restaurant._id;

      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));

      // Show success toast
      setShowAddedToast(true);
      setTimeout(() => setShowAddedToast(false), 2000);
      
      console.log('Added to cart:', cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };


  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Hero Header with Gradient Overlay */}
      <div className="relative h-[45vh] w-full">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/60" />

        {/* Top Actions */}
        <div className="absolute top-12 left-4 right-4 flex justify-between">
          <FramerMotion.motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-800 shadow-lg"
          >
            <ArrowLeft size={22} />
          </FramerMotion.motion.button>
          <div className="flex gap-2">
            <FramerMotion.motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-3 rounded-2xl shadow-lg transition-colors ${isFavorite ? "bg-red-500 text-white" : "bg-white/90 backdrop-blur-md text-gray-800"}`}
            >
              <Heart size={22} fill={isFavorite ? "white" : "none"} />
            </FramerMotion.motion.button>
            <FramerMotion.motion.button
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-800 shadow-lg"
            >
              <Share2 size={22} />
            </FramerMotion.motion.button>
          </div>
        </div>

        {/* Bestseller Badge */}
        {item.isBestseller && (
          <FramerMotion.motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-12 left-6 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold"
          >
            Bestseller
          </FramerMotion.motion.div>
        )}
      </div>

      <div className="px-5 -mt-8 relative bg-white rounded-t-3xl pt-6">
        {/* Title & Tag */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-green-500 rounded-sm flex items-center justify-center bg-white">
                  <div className="w-2 h-1.5 bg-green-500 rounded-sm"></div>
                </div>
                <span className="text-xs font-medium text-green-600">
                  Pure Veg
                </span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />
                <span className="text-xs font-semibold text-gray-700">
                  {item.rating}
                </span>
                <span className="text-xs text-gray-400">({item.reviews})</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-600">
              Rs. {item.price}
            </p>
            {item.originalPrice && (
              <p className="text-sm text-gray-400 line-through">
                Rs. {item.originalPrice}
              </p>
            )}
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
            <Clock size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-gray-600">
              {item.prepTime}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-gray-600">
              {item.calories} kcal
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="font-bold text-gray-800">About this item</h3>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Nutritional Info */}
        <div className="mt-6">
          <h3 className="font-bold text-gray-800 mb-3">Nutritional Facts</h3>
          <div className="grid grid-cols-4 gap-2">
            {nutritionalInfo.map((nutrient, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-3 text-center"
              >
                <p className="text-xs font-bold text-gray-800">
                  {nutrient.value}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {nutrient.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-4">
            Add-ons{" "}
            <span className="text-gray-400 text-sm font-normal">
              (Optional)
            </span>
          </h3>
          <div className="space-y-3">
            {addons.map((addon) => (
              <FramerMotion.motion.label
                key={addon.id}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                  selectedAddons.includes(addon.id)
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedAddons.includes(addon.id)
                        ? "bg-orange-500 border-orange-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAddons.includes(addon.id) && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-gray-800 text-sm font-semibold block">
                      {addon.name}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {addon.description}
                    </span>
                  </div>
                </div>
                <span className="text-orange-600 text-sm font-semibold">
                  + Rs. {addon.price}
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  onChange={() => toggleAddon(addon.id)}
                />
              </FramerMotion.motion.label>
            ))}
          </div>
        </div>

        {/* Selected Addons Summary */}
        {selectedAddons.length > 0 && (
          <FramerMotion.motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-orange-50 rounded-2xl"
          >
            <p className="text-xs font-semibold text-orange-600 mb-2">
              Selected Add-ons
            </p>
            <div className="flex flex-wrap gap-2">
              {addons
                .filter((a) => selectedAddons.includes(a.id))
                .map((addon) => (
                  <span
                    key={addon.id}
                    className="bg-white text-orange-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {addon.name}
                  </span>
                ))}
            </div>
          </FramerMotion.motion.div>
        )}

        {/* Quantity Selector */}
        <div className="mt-8 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Quantity</h3>
          <FramerMotion.motion.div
            className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl"
            initial={false}
          >
            <FramerMotion.motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2.5 bg-white rounded-xl shadow-sm text-gray-700"
            >
              <Minus size={18} />
            </FramerMotion.motion.button>
            <span className="font-bold w-8 text-center text-lg">
              {quantity}
            </span>
            <FramerMotion.motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setQuantity(quantity + 1)}
              className="p-2.5 bg-white rounded-xl shadow-sm text-gray-700"
            >
              <Plus size={18} />
            </FramerMotion.motion.button>
          </FramerMotion.motion.div>
        </div>

        {/* Price Breakdown */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Base Price</span>
            <span className="text-gray-700">Rs. {item.price}</span>
          </div>
          {selectedAddons.length > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Add-ons</span>
              <span className="text-gray-700">
                + Rs.{" "}
                {addons
                  .filter((a) => selectedAddons.includes(a.id))
                  .reduce((sum, a) => sum + a.price, 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-500">Quantity</span>
            <span className="text-gray-500">x {quantity}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-orange-600">
              Rs. {calculateTotal()}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <FramerMotion.motion.div
        className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        initial={{ y: 0 }}
        animate={{ y: 0 }}
      >
        <FramerMotion.motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 py-4 rounded-2xl flex items-center justify-between px-6 shadow-lg shadow-orange-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div className="text-left">
              <span className="text-white font-bold block">Add to Cart</span>
              <span className="text-white/80 text-xs">
                {quantity} item{quantity > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <span className="text-white font-bold text-lg">
            Rs. {calculateTotal()}
          </span>
        </FramerMotion.motion.button>
      </FramerMotion.motion.div>

      {/* Added to Cart Toast */}
      <FramerMotion.AnimatePresence>
        {showAddedToast && (
          <FramerMotion.motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={16} />
            </div>
            <span className="font-semibold">Added to cart!</span>
          </FramerMotion.motion.div>
        )}
      </FramerMotion.AnimatePresence>
    </div>
  );
};

export default ItemDetails;
