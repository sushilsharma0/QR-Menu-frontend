import React, { useEffect, useMemo, useState } from "react";
import { FiPrinter } from "react-icons/fi";
import api from "../../services/api";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const cleanPrintableText = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  const lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null") return fallback;
  return text;
};

const shortDisplayUrl = (value) => {
  const text = cleanPrintableText(value);
  if (!text) return "";
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${url.origin}/${parts.slice(0, -1).join("/")}/...`;
    }
    return url.origin;
  } catch {
    return text.length > 70 ? `${text.slice(0, 67)}...` : text;
  }
};

const PrintQRButton = ({ qrModal, qrUrl, restaurant }) => {
  const [qrRestaurant, setQrRestaurant] = useState(null);

  useEffect(() => {
    if (qrModal.table?.qrToken) {
      fetchRestaurantData();
    }
  }, [qrModal.table?.qrToken]);

  const fetchRestaurantData = async () => {
    try {
      const res = await api.get(`/restaurant/tables/qr/${qrModal.table?.qrToken}`);
      setQrRestaurant(res.data.data);
    } catch (error) {
      console.error("Failed to fetch restaurant data:", error);
    }
  };

  const printableData = useMemo(() => {
    const table = qrModal.table || {};
    return {
      restaurantName: cleanPrintableText(
        restaurant?.name || qrRestaurant?.restaurantName || table.restaurantName,
        "Restaurant"
      ),
      restaurantLogo: cleanPrintableText(
        restaurant?.logo || qrRestaurant?.restaurantLogo || table.restaurantLogo
      ),
      restaurantTagline: cleanPrintableText(
        restaurant?.tagline || restaurant?.description || qrRestaurant?.restaurantTagline,
        "Scan, choose, and order from your table"
      ),
      tableNumber: cleanPrintableText(table.tableNumber, "N/A"),
      qrCode: cleanPrintableText(table.qrCode),
      qrUrl: cleanPrintableText(qrUrl),
      qrUrlDisplay: shortDisplayUrl(qrUrl),
    };
  }, [qrModal.table, qrRestaurant, qrUrl, restaurant]);

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const printContent = `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 18px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #ffffff;
            font-family: 'Inter', Arial, sans-serif;
            color: #1f2937;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .stand {
            width: 360px;
            overflow: hidden;
            border: 1px solid #e7d8cf;
            border-radius: 28px;
            background: linear-gradient(180deg, #fffaf5 0%, #ffffff 44%);
            box-shadow: 0 22px 60px rgba(79, 22, 0, 0.16);
          }
          .hero {
            padding: 24px 22px 16px;
            text-align: center;
            background: radial-gradient(circle at top left, #faece8, transparent 45%), #ffffff;
          }
          .logo {
            width: 64px;
            height: 64px;
            object-fit: cover;
            border-radius: 18px;
            border: 3px solid #ffffff;
            box-shadow: 0 10px 24px rgba(79, 22, 0, 0.18);
            margin: 0 auto 10px;
            display: block;
          }
          .name {
            margin: 0;
            font-size: 25px;
            line-height: 1.1;
            font-weight: 800;
            color: #391000;
          }
          .tagline {
            margin: 8px auto 0;
            max-width: 280px;
            font-size: 13px;
            line-height: 1.45;
            color: #6b7280;
          }
          .qr-wrap {
            margin: 18px auto 14px;
            width: 280px;
            height: 280px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 26px;
            border: 1px solid #eadbd3;
            background: #ffffff;
            padding: 16px;
            box-shadow: inset 0 0 0 8px #fffcf1;
          }
          .qr-wrap img.qr {
            width: 240px;
            height: 240px;
            object-fit: contain;
            display: block;
          }
          .qr-logo {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 54px;
            height: 54px;
            transform: translate(-50%, -50%);
            border-radius: 16px;
            border: 5px solid #ffffff;
            background: #ffffff;
            object-fit: cover;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
          }
          .cta {
            margin: 0;
            font-size: 21px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: #391000;
          }
          .table {
            display: inline-block;
            margin-top: 12px;
            padding: 9px 18px;
            border-radius: 999px;
            background: #391000;
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.04em;
          }
          .footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            padding: 16px 18px 20px;
            border-top: 1px solid #f0e2db;
            background: #ffffff;
          }
          .feature {
            border-radius: 16px;
            background: #fffcf1;
            padding: 10px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #4f1600;
          }
          .url {
            grid-column: 1 / -1;
            margin: 4px 0 0;
            word-break: break-all;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 0; }
            .stand { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="stand">
          <div class="hero">
            ${
              printableData.restaurantLogo
                ? `<img class="logo" src="${escapeHtml(printableData.restaurantLogo)}" alt="Restaurant logo" />`
                : ""
            }
            <h1 class="name">${escapeHtml(printableData.restaurantName)}</h1>
            <p class="tagline">${escapeHtml(printableData.restaurantTagline)}</p>
            <div class="qr-wrap">
              <img class="qr" src="${escapeHtml(printableData.qrCode)}" alt="Menu QR Code" />
              ${
                printableData.restaurantLogo
                  ? `<img class="qr-logo" src="${escapeHtml(printableData.restaurantLogo)}" alt="" />`
                  : ""
              }
            </div>
            <p class="cta">SCAN TO ORDER</p>
            <div class="table">TABLE ${escapeHtml(printableData.tableNumber)}</div>
          </div>
          <div class="footer">
            <div class="feature">Digital Menu</div>
            <div class="feature">Instant Ordering</div>
            ${printableData.qrUrlDisplay ? `<p class="url">${escapeHtml(printableData.qrUrlDisplay)}</p>` : ""}
          </div>
        </div>
      </body>
    </html>`;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    iframe.contentWindow.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
    >
      <FiPrinter className="h-4 w-4" /> Print QR Stand
    </button>
  );
};

export default PrintQRButton;
