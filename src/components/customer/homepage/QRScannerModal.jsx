import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (isOpen) {
      // Initialize the scanner
      const scanner = new Html5QrcodeScanner(
        "reader", // The ID of the div where the camera will render
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        /* verbose= */ false,
      );

      scanner.render(
        (decodedText) => {
          // On Success
          onScanSuccess(decodedText);
          scanner.clear(); // Stop the camera
          onClose(); // Close modal
        },
        (error) => {
          // We can ignore minor scanning errors
          console.warn(error);
        },
      );

      // Cleanup: Stop camera when component unmounts or modal closes
      return () => {
        scanner
          .clear()
          .catch((err) => console.error("Failed to clear scanner", err));
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 bg-black flex flex-col items-center justify-center p-6">
      <button
        onClick={onClose}
        className="absolute top-10 right-6 p-2 bg-white/10 rounded-full text-white"
      >
        <X size={24} />
      </button>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Scan Table QR</h2>
        <p className="text-gray-400 text-sm">
          Align the QR code within the frame
        </p>
      </div>

      {/* The Camera Viewport */}
      <div
        id="reader"
        className="w-full max-w-sm rounded-3xl overflow-hidden bg-gray-900 border-2 border-orange-500 shadow-2xl shadow-orange-500/20"
      ></div>
    </div>
  );
};

export default QRScannerModal;
