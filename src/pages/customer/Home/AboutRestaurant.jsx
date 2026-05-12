import React, { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  Award,
  Clock,
  Coffee,
  Globe,
  Heart,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Share2,
  Shield,
  Smile,
  Star,
  ThumbsUp,
  Truck,
  Utensils,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";
import { getRestaurantPublicProfile } from "../../../services/customer";

const FEATURE_ICONS = {
  Utensils,
  Award,
  Heart,
  Star,
  Coffee,
  Leaf,
  Shield,
  Smile,
  ThumbsUp,
  Truck,
};

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&q=80",
];

export default function AboutRestaurant() {
  const { slug, token } = useParams();
  const homePath = slug && token ? `/home/${slug}/${token}` : "/";
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    getRestaurantPublicProfile(slug)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setErrored(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load restaurant profile:", err);
        setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const about = profile?.about || {};
  const hours = about.hours || {};
  const socials = about.socials || {};

  const heroImage =
    profile?.backgroundPhoto ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80";

  const gallery = useMemo(() => {
    const list = Array.isArray(about.gallery) ? about.gallery.filter(Boolean) : [];
    return list.length > 0 ? list : DEFAULT_GALLERY;
  }, [about.gallery]);

  const restaurantName = profile?.name || "Restaurant";
  const tagline = about.tagline || profile?.description || "Welcome to our restaurant";
  const aboutText =
    about.aboutText ||
    profile?.description ||
    "Tell guests what makes your restaurant special — cuisine, story, ingredients, vibe…";

  const hoursList = useMemo(() => {
    const result = DAY_ORDER.map((key) => ({
      key,
      label: key,
      hours: hours[key]?.trim() || "",
    }));
    const anyHours = result.some((row) => row.hours);
    if (anyHours) return result;
    const fallback =
      profile?.openingTime && profile?.closingTime
        ? `${profile.openingTime} - ${profile.closingTime}`
        : "";
    return result.map((row) => ({ ...row, hours: fallback }));
  }, [hours, profile?.openingTime, profile?.closingTime]);

  const socialLinks = [
    { key: "website", icon: Globe, value: socials.website, label: "Website" },
    { key: "facebook", icon: Share2, value: socials.facebook, label: "Facebook" },
    { key: "instagram", icon: AtSign, value: socials.instagram, label: "Instagram" },
    { key: "twitter", icon: AtSign, value: socials.twitter, label: "Twitter" },
  ].filter((s) => s.value);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf7]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (errored || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafaf7] p-6 text-center">
        <Utensils className="h-12 w-12 text-gray-400" />
        <h1 className="text-xl font-black text-gray-900">Restaurant not found</h1>
        <p className="max-w-xs text-sm text-gray-500">
          We couldn&apos;t load this restaurant&apos;s details. Please scan the table QR again.
        </p>
        <Link to={homePath} className="rounded-2xl bg-primary-600 px-4 py-2 text-sm font-bold text-white">
          Back home
        </Link>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28">
      <div
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${heroImage}')`,
        }}
      >
        <Link
          to={homePath}
          className="absolute left-4 top-4 z-10 rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
        >
          <X size={20} />
        </Link>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/15 backdrop-blur">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={restaurantName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Utensils size={28} />
              )}
            </div>
            <h1 className="text-3xl font-black">{restaurantName}</h1>
            <p className="mt-1 text-sm opacity-90">{tagline}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {(about.rating != null || about.reviewCount != null || about.establishedYear) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {about.rating != null && (
                  <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1">
                    <Star size={16} className="fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-gray-800">
                      {Number(about.rating).toFixed(1)}
                    </span>
                  </div>
                )}
                {about.reviewCount != null && (
                  <span className="text-xs text-gray-500">
                    ({about.reviewCount} reviews)
                  </span>
                )}
              </div>
              {about.establishedYear && (
                <div className="text-xs text-gray-500">
                  Since {about.establishedYear}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold text-gray-800">About Us</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {aboutText}
          </p>
          {(about.cuisine || about.priceRange) && (
            <div className="mt-4 flex gap-4">
              {about.cuisine && (
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-500">{about.cuisine}</p>
                  <p className="text-xs text-gray-500">Cuisine</p>
                </div>
              )}
              {about.priceRange && (
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-500">{about.priceRange}</p>
                  <p className="text-xs text-gray-500">Price</p>
                </div>
              )}
            </div>
          )}
        </div>

        {Array.isArray(about.features) && about.features.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-4">
              {about.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[feature.icon] || Utensils;
                return (
                  <div key={`${feature.label}-${index}`} className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                      <Icon size={20} className="text-orange-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">{feature.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-800">Contact Us</h2>
          <div className="space-y-3">
            {profile.address && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-bold text-gray-800">{profile.address}</p>
                </div>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                  <Phone size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-bold text-gray-800">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                  <Mail size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-bold text-gray-800">{profile.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800">Opening Hours</h2>
          </div>
          <div className="space-y-2">
            {hoursList.map((row) => (
              <div key={row.key} className="flex justify-between text-sm">
                <span className="capitalize text-gray-600">{row.label}</span>
                <span className="font-bold text-gray-800">
                  {row.hours || "Closed"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-bold text-gray-800">Follow Us</h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                const href = s.value.startsWith("http") ? s.value : `https://${s.value}`;
                return (
                  <a
                    key={s.key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Icon size={14} />
                    {s.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-800">Gallery</h2>
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="h-24 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url('${image}')` }}
              />
            ))}
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
