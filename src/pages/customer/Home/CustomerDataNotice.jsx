import React, { useEffect, useState } from "react";
import { MapPin, Mail, Phone, Shield, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../../utils/customerPortalContext";
import { getRestaurantPublicProfile } from "../../../services/customer";

export default function CustomerDataNotice() {
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
        console.error("Failed to load privacy policy:", err);
        setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const privacy = profile?.privacyPolicy || null;
  const enabled = privacy?.enabled === true;
  const sections = Array.isArray(privacy?.sections) ? privacy.sections.filter((s) => s.title) : [];

  const restaurantName = profile?.name || "this restaurant";
  const lastUpdated = privacy?.lastUpdated
    ? new Date(privacy.lastUpdated).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf7] dark:bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (errored || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafaf7] p-6 text-center dark:bg-gray-950">
        <Shield className="h-12 w-12 text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Privacy policy unavailable</h1>
        <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
          We couldn&apos;t load this restaurant&apos;s privacy policy. Please try again later.
        </p>
        <Link to={homePath} className="rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
          Back home
        </Link>
        <Navigation />
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
      <Shield className="mx-auto mb-3 h-10 w-10 text-gray-400" />
      <h2 className="font-semibold text-gray-800 dark:text-gray-100">
        {restaurantName} hasn&apos;t published a privacy policy yet
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        The restaurant administrator can publish a policy from their admin panel under
        &ldquo;About &amp; Privacy&rdquo;.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="relative bg-gradient-to-r from-primary-700 to-primary-900 p-6 text-white">
        <div className="flex items-center justify-center gap-3">
          <Shield size={32} />
          <div>
            <h1 className="text-2xl font-semibold">Privacy Policy</h1>
            <p className="mt-1 text-sm opacity-90">
              {lastUpdated ? `Last Updated: ${lastUpdated}` : restaurantName}
            </p>
          </div>
        </div>
        <Link
          to={homePath}
          className="absolute left-4 top-4 z-10 rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
        >
          <X size={20} />
        </Link>
      </div>

      <div className="space-y-4 p-4">
        {!enabled || sections.length === 0 ? (
          renderEmptyState()
        ) : (
          sections.map((section, index) => (
            <div
              key={`${section.title}-${index}`}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">{section.title}</h2>
              {section.content && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {section.content}
                </p>
              )}
            </div>
          ))
        )}

        {enabled && (privacy?.contactEmail || privacy?.contactPhone || privacy?.contactAddress) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">Contact Us</h2>
            <div className="space-y-3">
              {privacy.contactEmail && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
                    <Mail size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <a
                      href={`mailto:${privacy.contactEmail}`}
                      className="text-sm font-semibold text-gray-800 dark:text-gray-100"
                    >
                      {privacy.contactEmail}
                    </a>
                  </div>
                </div>
              )}
              {privacy.contactPhone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
                    <Phone size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {privacy.contactPhone}
                    </p>
                  </div>
                </div>
              )}
              {privacy.contactAddress && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
                    <MapPin size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                    <p className="whitespace-pre-line text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {privacy.contactAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="py-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            By using {restaurantName}, you agree to this Privacy Policy
          </p>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
