import React from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";

/** Lightweight skeleton for order tracking & bill-style pages (mobile-first). */
export function OrderTrackingSkeleton() {
  return (
    <div className="min-h-screen bg-surface-50/80 pb-32">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 px-4 pb-4 pt-12 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="space-y-2 text-center">
            <div className="mx-auto h-4 w-36 animate-pulse rounded-md bg-gray-100" />
            <div className="mx-auto h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pt-5 lg:grid-cols-2">
        <LazyMotion features={domAnimation}>
          <m.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.1 }}
          className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-6 shadow-inner"
          >
          <div className="flex gap-3">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/80" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-[80%] max-w-[240px] rounded bg-white/90" />
              <div className="h-3 w-1/2 rounded bg-white/70" />
              <div className="mt-4 h-10 w-full rounded-xl bg-white/60" />
            </div>
          </div>
          </m.div>
        </LazyMotion>
        {["order-card-1", "order-card-2", "order-card-3"].map((key) => (
          <div
            key={key}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-[66%] rounded bg-gray-100" />
                <div className="h-3 w-full rounded bg-gray-50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-50/80 pb-32">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 px-4 pb-4 pt-12 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 pt-5">
        <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-lg">
          <div className="h-40 animate-pulse bg-gradient-to-r from-gray-800 to-gray-700" />
          <div className="space-y-3 p-6">
            {["bill-line-1", "bill-line-2", "bill-line-3", "bill-line-4"].map((key) => (
              <div key={key} className="flex justify-between gap-4">
                <div className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
