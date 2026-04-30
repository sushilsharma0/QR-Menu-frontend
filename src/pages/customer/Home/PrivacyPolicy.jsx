import React from "react";
import {
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Mail,
  User,
  Smartphone,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const policySections = [
  {
    title: "Introduction",
    content: `Welcome to Foodies Cafe. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our restaurant ordering and dining services.`,
  },
  {
    title: "Information We Collect",
    items: [
      {
        icon: User,
        label: "Personal Information",
        description:
          "Name, phone number, email address, and delivery address when you create an account or place an order.",
      },
      {
        icon: Database,
        label: "Order Information",
        description:
          "Details of your orders, including items purchased, order history, and special preferences.",
      },
      {
        icon: Globe,
        label: "Usage Data",
        description:
          "Information about how you interact with our app, including pages visited and features used.",
      },
      {
        icon: Smartphone,
        label: "Device Information",
        description:
          "Device type, operating system, and unique device identifiers.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    items: [
      {
        label: "Order Processing",
        description: "To process and deliver your food orders efficiently.",
      },
      {
        label: "Account Management",
        description:
          "To create and manage your account, including authentication and customer support.",
      },
      {
        label: "Personalization",
        description:
          "To recommend dishes and offers based on your preferences and order history.",
      },
      {
        label: "Communications",
        description:
          "To send you order updates, promotional offers, and important notifications.",
      },
      {
        label: "Improvement",
        description:
          "To analyze usage patterns and improve our services and user experience.",
      },
    ],
  },
  {
    title: "Information Sharing",
    content: `We do not sell or rent your personal information to third parties. We may share your information with:
    • Our restaurant partners for order fulfillment
    • Payment processors for secure transactions
    • Delivery partners for order delivery
    • Legal authorities when required by law
    
    We ensure all third parties follow strict data protection guidelines.`,
  },
  {
    title: "Data Security",
    items: [
      {
        icon: Lock,
        label: "Encryption",
        description:
          "All sensitive data is encrypted using industry-standard SSL/TLS protocols.",
      },
      {
        icon: Shield,
        label: "Access Control",
        description:
          "Strict access controls limit employee access to personal data.",
      },
      {
        icon: Eye,
        label: "Regular Audits",
        description:
          "We conduct regular security audits to ensure data protection compliance.",
      },
    ],
  },
  {
    title: "Your Rights",
    items: [
      {
        label: "Access",
        description:
          "You can request a copy of all personal data we hold about you.",
      },
      {
        label: "Correction",
        description:
          "You can update or correct any inaccurate personal information.",
      },
      {
        label: "Deletion",
        description:
          "You can request deletion of your account and personal data.",
      },
      {
        label: "Opt-out",
        description:
          "You can opt-out of promotional communications at any time.",
      },
    ],
  },
  {
    title: "Cookies & Tracking",
    content: `We use cookies and similar tracking technologies to enhance your browsing experience. Cookies help us remember your preferences, analyze site traffic, and understand how our app is used. You can control cookie settings through your browser preferences.`,
  },
  {
    title: "Children's Privacy",
    content: `Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will immediately delete the information.`,
  },
  {
    title: "Changes to Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.`,
  },
  {
    title: "Contact Us",
    content: `If you have any questions or concerns about this Privacy Policy, please contact us:
    
    Email: privacy@foodiescafe.com
    Phone: +91 98765 43210
    Address: 123 Food Street, Culinary District, City - 400001`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex justify-center items-center gap-3">
          <Shield size={32} />
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-sm opacity-90 mt-1">
              Last Updated: April 26, 2026
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="absolute text-white top-4 z-10 left-4 bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          <X size={20} />
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {policySections.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <h2 className="font-bold text-gray-800 mb-3">{section.title}</h2>

            {section.content && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            )}

            {section.items && (
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex gap-3">
                    {item.icon && (
                      <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center flex-0 mt-0.5">
                        <item.icon size={14} className="text-orange-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            By using Foodies Cafe, you agree to this Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
