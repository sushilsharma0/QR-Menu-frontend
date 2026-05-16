import React, { useEffect, useMemo, useState } from "react";
import toast from "@utils/toast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEdit3,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSlash,
  FiUser,
} from "react-icons/fi";
import api from "../../services/api";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { DEFAULT_CURRENCY_SYMBOL } from "../../utils/currency";

const statusMeta = {
  pending: {
    label: "Pending",
    icon: FiClock,
    pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  },
  approved: {
    label: "Approved",
    icon: FiCheckCircle,
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
    accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  rejected: {
    label: "Rejected",
    icon: FiSlash,
    pill: "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900",
    accent: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200",
  },
  suspended: {
    label: "Suspended",
    icon: FiAlertCircle,
    pill: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
    accent: "bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-200",
  },
};

const filters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "owing", label: "Owing" },
];

const money = (value) => `${DEFAULT_CURRENCY_SYMBOL}${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getLimitUsage = (row) => {
  const owed = Number(row?.balanceOwed || 0);
  const limit = Number(row?.creditLimit || 0);
  if (limit <= 0) return { percent: owed > 0 ? 100 : 0, label: "No limit set", over: false };
  const percent = Math.min(100, Math.round((owed / limit) * 100));
  return { percent, label: `${percent}% used`, over: owed > limit };
};

const StatusPill = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.pill}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

const MetricCard = ({ label, value, sub, icon: Icon, tone = "primary" }) => {
  const tones = {
    primary: "from-primary-600 to-secondary-500",
    success: "from-emerald-500 to-teal-500",
    warning: "from-amber-500 to-orange-500",
    danger: "from-red-500 to-rose-500",
    neutral: "from-slate-600 to-gray-500",
  };
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-50">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-sm`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

const AccountCard = ({ row, active, onView }) => {
  const usage = getLimitUsage(row);
  const owed = Number(row.balanceOwed || 0);
  return (
    <div
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${
        active ? "border-primary-400 ring-2 ring-primary-100 dark:ring-primary-950" : "border-surface-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${statusMeta[row.status]?.accent || statusMeta.pending.accent}`}>
          <FiUser className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-black text-gray-950 dark:text-gray-50">{row.name}</p>
            <StatusPill status={row.status} />
          </div>
          <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{row.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-gray-950/50">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Balance</p>
          <p className={`mt-1 text-lg font-black ${owed > 0 ? "text-amber-700 dark:text-amber-300" : "text-gray-950 dark:text-gray-100"}`}>
            {money(owed)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-gray-950/50">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Open bills</p>
          <p className="mt-1 text-lg font-black text-gray-950 dark:text-gray-100">{row.openCreditOrders || 0}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Credit limit</span>
          <span className={`font-bold ${usage.over ? "text-red-600 dark:text-red-300" : "text-gray-600 dark:text-gray-300"}`}>
            {usage.label}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full ${usage.over ? "bg-red-500" : owed > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${usage.percent}%` }}
          />
        </div>
      </div>

      <Button type="button" size="sm" className="mt-4 w-full" onClick={onView}>
        View details
      </Button>
    </div>
  );
};

export default function CreditCustomers() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0, suspended: 0, owing: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draftLimit, setDraftLimit] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [paymentForms, setPaymentForms] = useState({});
  const [payingOrderId, setPayingOrderId] = useState("");

  const load = async ({ keepSelected = true } = {}) => {
    try {
      setLoading(true);
      const [listRes, sumRes] = await Promise.all([
        api.get("/restaurant/credit-customers", {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            status: statusFilter,
            q: query.trim() || undefined,
          },
        }),
        api.get("/restaurant/credit-customers/summary"),
      ]);
      const nextItems = listRes?.data?.data?.items || [];
      setItems(nextItems);
      setStatusCounts(listRes?.data?.data?.statusCounts || { pending: 0, approved: 0, rejected: 0, suspended: 0, owing: 0 });
      setPagination((prev) => ({ ...prev, ...(listRes?.data?.data?.pagination || {}) }));
      setSummary(sumRes?.data?.data || null);
      setSelectedId((current) => (keepSelected && nextItems.some((row) => row._id === current) ? current : ""));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load credit customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, query.trim() ? 250 : 0);
    return () => clearTimeout(timer);
  }, [pagination.page, pagination.limit, statusFilter, query]);

  const selected = useMemo(() => {
    return items.find((row) => row._id === selectedId) || items[0] || null;
  }, [items, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setDraftLimit(String(selected.creditLimit || ""));
    setDraftNotes(selected.notes || "");
  }, [selected?._id]);

  useEffect(() => {
    if (!selected?._id) {
      setLedger(null);
      return;
    }
    let alive = true;
    const loadLedger = async () => {
      try {
        setLedgerLoading(true);
        const res = await api.get(`/restaurant/credit-customers/${selected._id}/ledger`);
        if (alive) setLedger(res?.data?.data || null);
      } catch {
        if (alive) setLedger(null);
      } finally {
        if (alive) setLedgerLoading(false);
      }
    };
    loadLedger();
    return () => {
      alive = false;
    };
  }, [selected?._id]);

  const localStats = statusCounts;

  const patch = async (id, body, message = "Updated") => {
    try {
      setSaving(true);
      await api.patch(`/restaurant/credit-customers/${id}`, body);
      toast.success(message);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const reject = () => {
    if (!selected) return;
    const reason = window.prompt("Reason for rejection (optional)") || "";
    patch(selected._id, { status: "rejected", rejectedReason: reason }, "Application rejected");
  };

  const saveAccount = () => {
    if (!selected) return;
    patch(selected._id, { creditLimit: draftLimit, notes: draftNotes }, "Account details saved");
  };

  const getPaymentForm = (orderId, due) =>
    paymentForms[orderId] || { paymentMethod: "cash", amount: Number(due || 0).toFixed(2) };

  const updatePaymentForm = (orderId, patchValue) => {
    setPaymentForms((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { paymentMethod: "cash", amount: "" }),
        ...patchValue,
      },
    }));
  };

  const recordCreditPayment = async (order) => {
    if (!selected) return;
    const due = Math.max(0, Number(order.grandTotal || 0) - Number(order.amountPaidTotal || 0));
    const form = getPaymentForm(order._id, due);
    const amount = Number(form.amount) || due;
    if (amount <= 0) return toast.error("Enter a valid payment amount");
    if (amount - due > 0.02) return toast.error("Payment cannot exceed balance due");

    try {
      setPayingOrderId(order._id);
      await api.post(`/restaurant/credit-customers/${selected._id}/orders/${order._id}/pay`, {
        paymentMethod: form.paymentMethod,
        amount,
      });
      toast.success(amount >= due - 0.02 ? "Credit balance marked paid" : "Credit payment recorded");
      const [listRes, sumRes, ledgerRes] = await Promise.all([
        api.get("/restaurant/credit-customers", {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            status: statusFilter,
            q: query.trim() || undefined,
          },
        }),
        api.get("/restaurant/credit-customers/summary"),
        api.get(`/restaurant/credit-customers/${selected._id}/ledger`),
      ]);
      setItems(listRes?.data?.data?.items || []);
      setStatusCounts(listRes?.data?.data?.statusCounts || { pending: 0, approved: 0, rejected: 0, suspended: 0, owing: 0 });
      setPagination((prev) => ({ ...prev, ...(listRes?.data?.data?.pagination || {}) }));
      setSummary(sumRes?.data?.data || null);
      setLedger(ledgerRes?.data?.data || null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not record payment");
    } finally {
      setPayingOrderId("");
    }
  };

  const selectedUsage = getLimitUsage(selected);
  const selectedOwed = Number(selected?.balanceOwed || 0);
  const selectedLimit = Number(selected?.creditLimit || 0);
  const totalAccountCount =
    Number(statusCounts.pending || 0) +
    Number(statusCounts.approved || 0) +
    Number(statusCounts.rejected || 0) +
    Number(statusCounts.suspended || 0);
  const filterCount = (value) => {
    if (value === "all") return totalAccountCount;
    return Number(statusCounts[value] || 0);
  };

  return (
    <div className="restaurant-portal space-y-6">
      <section className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-surface-100 bg-gradient-to-r from-primary-50 via-white to-emerald-50 p-5 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700 shadow-sm dark:border-primary-900 dark:bg-gray-950 dark:text-primary-300">
                <FiShield className="h-4 w-4" />
                House Account Control
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 dark:text-gray-50">Credit customers</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                Review applications, approve credit accounts, track balances, and manage limits for customers who use pay later.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => load()} disabled={loading} className="gap-2">
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4 md:p-7">
          <MetricCard
            label="Open exposure"
            value={money(summary?.totalOwed || 0)}
            sub={`${summary?.openCreditOrderCount || 0} unpaid credit orders`}
            icon={FiDollarSign}
            tone="warning"
          />
          <MetricCard label="Approved accounts" value={localStats.approved} sub={`${localStats.owing} customers currently owing`} icon={FiCheckCircle} tone="success" />
          <MetricCard label="Pending review" value={localStats.pending} sub="Applications waiting for decision" icon={FiClock} tone="primary" />
          <MetricCard label="Restricted" value={localStats.rejected + localStats.suspended} sub={`${localStats.suspended} suspended / ${localStats.rejected} rejected`} icon={FiAlertCircle} tone="danger" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <Input
                icon={FiSearch}
                label="Find customer"
                placeholder="Search name, email, phone, or notes"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              />
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                      statusFilter === filter.value
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-surface-50 text-gray-600 hover:bg-surface-100 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1 opacity-70">({filterCount(filter.value)})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-surface-200 bg-white px-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50 text-primary-700 dark:bg-gray-950 dark:text-primary-300">
                <FiUser className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-black text-gray-950 dark:text-gray-50">No credit accounts found</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try another status filter or search term.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((row) => (
                  <AccountCard key={row._id} row={row} active={selected?._id === row._id} onView={() => setSelectedId(row._id)} />
                ))}
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-gray-600 dark:text-gray-300">
                  Showing page {pagination.page} of {pagination.pages} - {pagination.total} accounts
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={pagination.limit}
                    onChange={(e) => setPagination((prev) => ({ ...prev, page: 1, limit: Number(e.target.value) || 24 }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                  >
                    <option value={12}>12 / page</option>
                    <option value={24}>24 / page</option>
                    <option value={48}>48 / page</option>
                    <option value={96}>96 / page</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pagination.page >= pagination.pages || loading}
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:sticky xl:top-6">
          {!selected ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Select a customer account to view details.</div>
          ) : (
            <>
              <div className="border-b border-surface-100 p-5 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <StatusPill status={selected.status} />
                    <h2 className="mt-3 truncate text-2xl font-black text-gray-950 dark:text-gray-50">{selected.name}</h2>
                    <p className="mt-1 flex items-center gap-2 truncate text-sm text-gray-500 dark:text-gray-400">
                      <FiMail className="shrink-0" />
                      {selected.email}
                    </p>
                    {selected.phone && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <FiPhone className="shrink-0" />
                        {selected.phone}
                      </p>
                    )}
                  </div>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusMeta[selected.status]?.accent || statusMeta.pending.accent}`}>
                    <FiUser className="h-6 w-6" />
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Balance owed</p>
                    <p className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-200">{money(selectedOwed)}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-950/50">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Open bills</p>
                    <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-50">{selected.openCreditOrders || 0}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-surface-200 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Credit limit health</p>
                      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {selectedLimit > 0 ? `${money(selectedOwed)} of ${money(selectedLimit)}` : "Set a limit to monitor account usage."}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedUsage.over ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {selectedUsage.over ? "Over limit" : selectedUsage.label}
                    </span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${selectedUsage.over ? "bg-red-500" : selectedOwed > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${selectedUsage.percent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Applied" value={formatDate(selected.createdAt)} />
                  <Info label="Approved" value={formatDate(selected.approvedAt)} />
                </div>

                <div className="rounded-2xl border border-surface-200 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Credit transaction history</p>
                      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {ledgerLoading ? "Loading account activity..." : `${ledger?.summary?.orderCount || 0} credit bills tracked`}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-50 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-950 dark:text-gray-300">
                      Paid {money(ledger?.summary?.totalPaid || 0)}
                    </span>
                  </div>
                  <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {ledgerLoading ? (
                      <p className="rounded-xl bg-surface-50 p-3 text-sm text-gray-500 dark:bg-gray-950/50">Loading history...</p>
                    ) : ledger?.orders?.length ? (
                      ledger.orders.map((order) => {
                        const due = Math.max(0, Number(order.grandTotal || 0) - Number(order.amountPaidTotal || 0));
                        const txs = (ledger.transactions || []).filter((tx) => String(tx.customerOrder) === String(order._id));
                        const form = getPaymentForm(order._id, due);
                        return (
                          <div key={order._id} className="rounded-xl bg-surface-50 p-3 text-sm dark:bg-gray-950/50">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-gray-950 dark:text-gray-50">#{order.orderNumber}</p>
                                <p className="text-xs font-semibold capitalize text-gray-500">{order.status} / {order.paymentStatus}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-gray-950 dark:text-gray-50">{money(order.grandTotal)}</p>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Due {money(due)}</p>
                              </div>
                            </div>
                            {txs.length > 0 && (
                              <div className="mt-2 space-y-1 border-t border-gray-200 pt-2 dark:border-gray-800">
                                {txs.map((tx) => (
                                  <div key={tx._id} className="flex justify-between gap-3 text-xs text-gray-600 dark:text-gray-300">
                                    <span className="capitalize">{tx.paymentMethod} - {tx.status}</span>
                                    <span className="font-bold">{money(tx.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {due > 0 && selected.status === "approved" && (
                              <div className="mt-3 grid gap-2 border-t border-gray-200 pt-3 dark:border-gray-800 sm:grid-cols-[110px_1fr]">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                  Method
                                  <select
                                    value={form.paymentMethod}
                                    onChange={(e) => updatePaymentForm(order._id, { paymentMethod: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-bold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="online">Online</option>
                                  </select>
                                </label>
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                  Amount
                                  <div className="mt-1 flex gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={form.amount}
                                      onChange={(e) => updatePaymentForm(order._id, { amount: e.target.value })}
                                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-bold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={payingOrderId === order._id}
                                      onClick={() => recordCreditPayment(order)}
                                    >
                                      {payingOrderId === order._id ? "Saving..." : "Mark paid"}
                                    </Button>
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-xl bg-surface-50 p-3 text-sm text-gray-500 dark:bg-gray-950/50">No credit bills for this customer yet.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                    Credit limit
                    <input
                      type="number"
                      min="0"
                      value={draftLimit}
                      onChange={(e) => setDraftLimit(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950"
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                    Internal notes
                    <textarea
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      rows={4}
                      className="mt-1 w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950"
                      placeholder="Payment habits, contact preference, approval notes..."
                    />
                  </label>
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={saveAccount} disabled={saving}>
                    <FiEdit3 className="h-4 w-4" />
                    Save account details
                  </Button>
                </div>

                {selected.rejectedReason && (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
                    <p className="font-bold">Rejected reason</p>
                    <p className="mt-1">{selected.rejectedReason}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-surface-100 pt-5 dark:border-gray-800">
                  {selected.status === "pending" && (
                    <>
                      <Button type="button" variant="success" onClick={() => patch(selected._id, { status: "approved" }, "Application approved")} disabled={saving}>
                        Approve
                      </Button>
                      <Button type="button" variant="outline" onClick={reject} disabled={saving}>
                        Reject
                      </Button>
                    </>
                  )}
                  {selected.status === "approved" && (
                    <Button type="button" variant="outline" onClick={() => patch(selected._id, { status: "suspended" }, "Account suspended")} disabled={saving}>
                      Suspend account
                    </Button>
                  )}
                  {selected.status === "suspended" && (
                    <Button type="button" variant="primary" onClick={() => patch(selected._id, { status: "approved" }, "Account reinstated")} disabled={saving}>
                      Reinstate
                    </Button>
                  )}
                  {selected.status === "rejected" && (
                    <Button type="button" variant="primary" onClick={() => patch(selected._id, { status: "approved" }, "Application approved")} disabled={saving}>
                      Approve now
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Customers still order as guests. Credit applies when they choose pay later and verify their email with a code.
      </p>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div className="rounded-2xl bg-surface-50 p-3 dark:bg-gray-950/50">
    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 font-bold text-gray-950 dark:text-gray-100">{value}</p>
  </div>
);
