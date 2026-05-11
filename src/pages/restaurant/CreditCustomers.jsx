import React, { useEffect, useState } from "react";
import { FiDollarSign, FiMail, FiRefreshCw, FiUser } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const statusColors = {
  pending: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  approved: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  rejected: "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  suspended: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

export default function CreditCustomers() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [listRes, sumRes] = await Promise.all([
        api.get("/restaurant/credit-customers"),
        api.get("/restaurant/credit-customers/summary"),
      ]);
      setItems(listRes?.data?.data?.items || []);
      setSummary(sumRes?.data?.data || null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load credit customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id, body) => {
    try {
      await api.patch(`/restaurant/credit-customers/${id}`, body);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="restaurant-portal space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Credit customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Approve house accounts, track open credit from QR orders.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <FiDollarSign /> Open credit exposure
            </div>
            <p className="mt-2 text-3xl font-black text-primary-700 dark:text-primary-400">
              Rs. {Number(summary.totalOwed || 0).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{summary.openCreditOrderCount || 0} open credit orders</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-surface-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Applications & accounts</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No records yet.</div>
        ) : (
          <ul className="divide-y divide-surface-100 dark:divide-gray-800">
            {items.map((row) => (
              <li key={row._id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950/50">
                    <FiUser />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900 dark:text-gray-100">{row.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      <FiMail className="shrink-0" />
                      {row.email}
                    </p>
                    {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
                    <span
                      className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[row.status] || statusColors.pending}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                    Balance owed: Rs. {row.balanceOwed}
                  </p>
                  <p className="text-[11px] text-gray-400">{row.openCreditOrders || 0} open orders</p>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                          onClick={() => patch(row._id, { status: "approved" })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 dark:border-red-900 dark:text-red-300"
                          onClick={() => {
                            const reason = window.prompt("Reason (optional)") || "";
                            patch(row._id, { status: "rejected", rejectedReason: reason });
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {row.status === "approved" && (
                      <button
                        type="button"
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold dark:border-gray-700"
                        onClick={() => patch(row._id, { status: "suspended" })}
                      >
                        Suspend
                      </button>
                    )}
                    {row.status === "suspended" && (
                      <button
                        type="button"
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white"
                        onClick={() => patch(row._id, { status: "approved" })}
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Customers still order as guests. Credit applies only when they choose “Pay later” and verify email with a code.
      </p>
    </div>
  );
}
