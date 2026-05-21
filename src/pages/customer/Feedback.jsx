import React, { useState } from "react";
import { ArrowLeft, Star, Send, Heart } from "lucide-react";

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6 transition-transform duration-500 ease-out">
          <Heart size={48} fill="currentColor" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">Thank You!</h2>
        <p className="text-orange-900 mt-2 leading-relaxed">
          Your feedback helps us serve you better. We hope to see you again at
          Table 05!
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 px-8 py-3 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-100"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center border-b border-gray-50">
        <button className="p-2 bg-gray-50 rounded-xl">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-800">
          Rate Your Experience
        </h1>
      </header>

      <div className="px-8 pt-10">
        <div className="text-center mb-10">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            How was the food?
          </p>
          <h2 className="text-xl font-semibold text-gray-800">
            Your opinion matters to us!
          </h2>
        </div>

        {/* Star Rating System */}
        <div className="flex justify-center gap-3 mb-12">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="transition-transform active:scale-90 focus:outline-none"
            >
              <Star
                size={42}
                className={`transition-colors duration-200 ${
                  star <= (hover || rating)
                    ? "text-orange-400 fill-orange-400"
                    : "text-gray-200"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment Section */}
        <div className="space-y-2">
          <label htmlFor="customer-feedback-comment" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
            Care to share more?
          </label>
          <textarea
            id="customer-feedback-comment"
            rows="5"
            placeholder="Tell us what you loved or what we can improve…"
            className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all resize-none"
          ></textarea>
        </div>

        {/* Quick Tags (Upselling Engagement) */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Great Service",
            "Delicious Food",
            "Fast Delivery",
            "Cleanliness",
          ].map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-gray-50 rounded-full text-[11px] font-bold text-gray-500 border border-gray-100 active:bg-orange-50 active:text-orange-500 active:border-orange-200 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => setSubmitted(true)}
          className="w-full mt-12 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-200 active:scale-95 transition-all"
        >
          <Send size={18} />
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

export default Feedback;
