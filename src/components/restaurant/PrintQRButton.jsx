import axios from "axios";
import React, { useEffect, useState } from "react";
import { FiPrinter } from "react-icons/fi";
import api from "../../services/api";
const PrintQRButton = ({ qrModal }) => {
const [restaurantName, setRestaurantName] = useState("");

useEffect(() => {
    if (qrModal.table) {
      fetchRestaurantData();
    }
  }, [qrModal.table]);

  const fetchRestaurantData = async () => {
    try {
      const res = await api.get(
        `/restaurant/tables/qr/${qrModal.table?.qrToken}`,
      );
      const restaurantData = res.data.data.restaurantName;
      setRestaurantName(restaurantData);
      
    } catch (error) {
      console.error("Failed to fetch restaurant data:", error);
    }
  };

  const handlePrint = () => {
    // 1. Data extraction with fallbacks to match image defaults
    // const restaurantName = qrModal.table?.restaurantName || "Urban Bistro";
    const restaurantTagline =
      qrModal.table?.tagline || "Crafted Flavors, Modern Dining";
    const tableNumber = qrModal.table?.tableNumber || "14";
    const qrCode = qrModal.table?.qrCode; // Should be base64 string or URL

    // 2. Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    // 3. Generate content exactly matching the image design
    const printContent = `
    <html>
      <head>
        <style>
          /* Loading clean, professional fonts */
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600;700&display=swap');

          body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            background-color: white;
            -webkit-print-color-adjust: exact; /* Crucial for background colors in print */
            print-color-adjust: exact;
          }

          /* Main Card Container - Optimized for standard cardstock size */
          .card {
            width: 320px; /* Adjust based on actual card size needed */
            font-family: 'Inter', sans-serif;
            text-align: center;
            color: #1a1a1a;
            padding: 8px;
          }

          /* Header Styling - Restaurant Info */
          .restaurant-name { 
            font-family: 'Playfair Display', serif; /* Serif font like image */
            font-size: 50px; 
            margin: 0; 
            font-weight: 700;
          }
          .tagline { 
            font-size: 18px; 
            color: #666; 
            margin: 6px 0 24px; 
            font-weight: 400;
          }

          /* QR Code Container - Matches light grey box in image */
          .qr-container {
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            display: inline-block;
            padding: 12px;
            margin-bottom: 16px;
          }
          .qr-container img {
            width: 300px;
            height: 300px;
            display: block;
          }

          /* Primary CTA */
          .call-to-action {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 10px;
            text-transform: uppercase;
          }

          /* Table Number Badge - Black pill with white text */
          .table-badge {
            background-color: #000;
            color: #fff;
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 24px;
            text-transform: uppercase;
          }

          /* Bottom Feature List */
          .features {
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: center;
            gap: 20px;
            padding-top: 20px;
            margin-top: 20px;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #444;
            font-weight: 600;
            text-transform: uppercase;
          }
          .feature-icon {
            width: 16px;
            height: 16px;
            opacity: 0.7;
          }

          /* Final Slogan */
          .slogan {
            margin-top: 20px;
            font-size: 12px;
            color: #888;
            font-weight: 400;
          }

          @media print {
            body { padding: 0; }
            .card { border: none; box-shadow: none; margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="restaurant-name">${restaurantName}</div>
          <p class="tagline">${restaurantTagline}</p>

          <div class="qr-container">
            <!-- Ensure qrCode is a valid base64 image or accessible URL -->
            <img src="${qrCode}" alt="Menu QR Code" />
          </div>

          <p class="call-to-action">SCAN TO ORDER</p>
          <div class="table-badge">TABLE ${tableNumber}</div>

          <div class="features">
            <div class="feature-item">
              <!-- Using simple Unicode or SVGs for icons -->
              <span class="feature-icon">🍴</span>
              <span>Digital Menu</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📱</span>
              <span>Instant Ordering</span>
            </div>
          </div>

          <p class="slogan">Powered by QR Menu.</p>
        </div>
      </body>
    </html>
    `;

    // 4. Write content to iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    // 5. Wait for image/fonts to load, then print
    iframe.contentWindow.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Cleanup: Remove iframe after the print dialog handles it
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  return (
    <button
      onClick={handlePrint}
      className="gap-2 flex items-center px-3 rounded-lg bg-red-400 border-slate-300 hover:bg-red-300 transition-colors"
    >
      <FiPrinter className="h-4 w-4" /> Print QR Stand
    </button>
  );
};

export default PrintQRButton;
