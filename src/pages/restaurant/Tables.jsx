import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCode,
  FiCopy,
  FiEdit2,
  FiExternalLink,
  FiGrid,
  FiImage,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiMapPin
} from "react-icons/fi";
import QRCode from "react-qr-code";
import toast from "@utils/toast";
import api from "../../services/api";
import { getParsedAuthUser } from "../../utils/authStorage";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import PrintQRButton from "../../components/restaurant/PrintQRButton";
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
} from "../../components/restaurant/RestaurantUI";
import { useRestaurantAutoRefresh } from "../../context/RestaurantRealtimeContext";
import { useSocket } from "../../hooks/useSocket";
import { useTenantRoutes } from "../../hooks/useTenantRoutes";

const tableStatusStyles = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
};

const floorStatusStyles = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-900",
  occupied: "border-rose-200 bg-rose-50 text-rose-900",
  reserved: "border-amber-200 bg-amber-50 text-amber-900",
  billing: "border-sky-200 bg-sky-50 text-sky-900",
  cleaning: "border-slate-200 bg-slate-50 text-slate-900",
};

const SEAT_STATUS_OPTIONS = ["available", "occupied", "reserved", "billing", "cleaning"];

function SeatStatusSelect({ table, onStatusChange, compact = false }) {
  const status = table.posStatus || "available";
  return (
    <select
      value={status}
      onChange={(event) => onStatusChange(table, event.target.value)}
      className={`rounded-full border font-bold capitalize outline-none transition focus:ring-2 focus:ring-primary-300 ${
        compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      } ${floorStatusStyles[status] || floorStatusStyles.available}`}
      title="Update seat status"
    >
      {SEAT_STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function FloorPlanView({ tables, onStatusChange }) {
  return (
    <div className="rounded-3xl border border-surface-200 bg-gradient-to-br from-surface-50 to-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-950">Floor Plan</h3>
          <p className="text-sm text-gray-500">Track live seating status by table. Use this as a quick operations board.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {SEAT_STATUS_OPTIONS.map((status) => (
            <span key={status} className={`rounded-full border px-2 py-1 capitalize ${floorStatusStyles[status]}`}>
              {status}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map((table) => {
          const status = table.posStatus || "available";
          return (
            <article key={table._id} className={`rounded-2xl border p-4 shadow-sm ${floorStatusStyles[status] || floorStatusStyles.available}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide opacity-70">{table.floor || "ground"}</p>
                  <h4 className="mt-1 text-xl font-black">Table {table.tableNumber}</h4>
                  <p className="mt-1 text-xs font-semibold opacity-75">
                    {table.capacity || 4} seats{table.area ? ` - ${table.area}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
                  {status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-1.5">
                {SEAT_STATUS_OPTIONS.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={status === nextStatus}
                    onClick={() => onStatusChange(table, nextStatus)}
                    className="rounded-lg bg-white/80 px-2 py-1.5 text-[11px] font-bold capitalize text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {nextStatus}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** POS takeaway/delivery channels — not physical dine-in tables with QR stands */
function isPhysicalDiningTable(table) {
  if (!table) return false;
  if (table.allowsConcurrentOrders) return false;
  return !/^POS-(TAKEAWAY|DELIVERY)$/i.test(String(table.tableNumber || "").trim());
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1,
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{start}-{end}</span> of{" "}
        <span className="font-semibold text-gray-900">{total}</span> tables
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((number, index) => {
            const previous = pages[index - 1];
            const showGap = previous && number - previous > 1;
            return (
              <React.Fragment key={number}>
                {showGap && <span className="px-1 text-sm text-gray-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(number)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                    number === page
                      ? "bg-primary-600 text-white shadow-sm"
                      : "border border-surface-200 bg-white text-gray-600 hover:bg-surface-50"
                  }`}
                >
                  {number}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function QRPreview({ table, qrUrl, logo, size = 132, className = "" }) {
  const logoSize = Math.max(34, Math.round(size * 0.22));

  if (!table?.qrToken) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-surface-100 text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        <FiImage className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-3xl border border-surface-200 bg-white p-3 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      {table.qrCode ? (
        <img
          src={table.qrCode}
          alt={`QR for Table ${table.tableNumber}`}
          className="h-full w-full object-contain"
        />
      ) : (
        <QRCode value={qrUrl} size={size - 28} />
      )}
      {logo && (
        <img
          src={logo}
          alt=""
          className="absolute left-1/2 top-1/2 object-cover shadow-md"
          style={{
            width: logoSize,
            height: logoSize,
            transform: "translate(-50%, -50%)",
            borderRadius: Math.round(logoSize * 0.28),
            border: "4px solid white",
            background: "white",
          }}
        />
      )}
    </div>
  );
}

function MetricTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-surface-200 bg-white/90 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

function TableActions({ table, onQr, onRegenerate, onEdit, onDelete, onMove, onMerge }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={() => onQr(table)}>
        <FiCode className="mr-1" /> QR
      </Button>
      <button
        type="button"
        onClick={() => onRegenerate(table._id)}
        className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50 hover:text-blue-800"
        title="Regenerate QR"
      >
        <FiRefreshCw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onEdit(table)}
        className="rounded-lg p-2 text-green-700 transition hover:bg-green-50 hover:text-green-800"
        title="Edit Table"
      >
        <FiEdit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onMove(table)}
        className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
        title="Move active order to another table"
      >
        Move
      </button>
      <button
        type="button"
        onClick={() => onMerge(table)}
        className="rounded-lg px-2 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
        title="Merge this table order into another table"
      >
        Merge
      </button>
      <button
        type="button"
        onClick={() => onDelete(table._id)}
        className="rounded-lg p-2 text-red-700 transition hover:bg-red-50 hover:text-red-800"
        title="Delete Table"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

const Tables = () => {
  const navigate = useNavigate();
  const { portalBase } = useTenantRoutes();
  const { socket } = useSocket();
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, table: null });
  const [transferModal, setTransferModal] = useState({ open: false, mode: "move", table: null, targetTableId: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTables = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      const [tablesRes, profileRes] = await Promise.all([
        api.get("/restaurant/tables"),
        api.get("/restaurant/auth/profile").catch(() => null),
      ]);
      setTables(tablesRes.data.data || []);
      setRestaurant(profileRes?.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      toast.error("Failed to fetch tables");
      setTables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useRestaurantAutoRefresh(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const handleTableUpdated = (updatedTable) => {
      if (!updatedTable?._id) {
        fetchTables(true);
        return;
      }
      setTables((current) =>
        current.map((table) => (String(table._id) === String(updatedTable._id) ? { ...table, ...updatedTable } : table)),
      );
    };
    socket.on("pos:table_updated", handleTableUpdated);
    return () => {
      socket.off("pos:table_updated", handleTableUpdated);
    };
  }, [socket]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/restaurant/tables/${id}`);
      toast.success("Table deleted");
      fetchTables(true);
    } catch (error) {
      toast.error("Failed to delete table");
    }
  };

  const handleRegenerateQR = async (id) => {
    try {
      await api.patch(`/restaurant/tables/${id}/regenerate-qr`);
      toast.success("QR code regenerated");
      fetchTables(true);
    } catch (error) {
      toast.error("Failed to regenerate QR code");
    }
  };

  const handleStatusChange = async (table, posStatus) => {
    const previousTables = tables;
    setTables((current) =>
      current.map((row) => (String(row._id) === String(table._id) ? { ...row, posStatus } : row)),
    );
    try {
      const response = await api.put(`/restaurant/tables/${table._id}`, { posStatus });
      const updatedTable = response?.data?.data;
      if (updatedTable?._id) {
        setTables((current) =>
          current.map((row) => (String(row._id) === String(updatedTable._id) ? { ...row, ...updatedTable } : row)),
        );
      }
      toast.success(`Table ${table.tableNumber} marked ${posStatus}`);
    } catch (error) {
      setTables(previousTables);
      toast.error(error.response?.data?.message || "Failed to update table status");
    }
  };

  const openTransferModal = (mode, table) => {
    const firstTarget = diningTables.find((row) => String(row._id) !== String(table._id));
    setTransferModal({
      open: true,
      mode,
      table,
      targetTableId: firstTarget?._id || "",
    });
  };

  const handleTransfer = async () => {
    if (!transferModal.table?._id || !transferModal.targetTableId) {
      toast.error("Choose a target table");
      return;
    }
    try {
      const endpoint = transferModal.mode === "merge" ? "merge" : "move-order";
      await api.patch(`/restaurant/tables/${transferModal.table._id}/${endpoint}`, {
        targetTableId: transferModal.targetTableId,
      });
      toast.success(transferModal.mode === "merge" ? "Tables merged" : "Order moved");
      setTransferModal({ open: false, mode: "move", table: null, targetTableId: "" });
      fetchTables(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Table transfer failed");
    }
  };

  const getQRUrl = (table) => {
    const authUser = getParsedAuthUser() || {};
    const restaurantSlug = restaurant?.slug || authUser.slug || "restaurant";

    if (!table?.qrToken) return "#";

    return `${window.location.origin}/home/${restaurantSlug}/${table.qrToken}`;
  };

  const logo = restaurant?.logo || "";

  const diningTables = useMemo(() => tables.filter(isPhysicalDiningTable), [tables]);

  const metrics = useMemo(() => {
    const active = diningTables.filter((table) => table.isActive).length;
    const capacity = diningTables.reduce((sum, table) => sum + Number(table.capacity || 0), 0);
    const floors = new Set(diningTables.map((table) => table.floor || "ground"));
    return {
      total: diningTables.length,
      active,
      inactive: diningTables.length - active,
      capacity,
      floors: floors.size,
    };
  }, [diningTables]);

  const floorOptions = useMemo(
    () =>
      Array.from(new Set(diningTables.map((table) => table.floor || "ground")))
        .filter(Boolean)
        .sort(),
    [diningTables],
  );

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    return diningTables.filter((table) => {
      const matchesSearch =
        !q ||
        String(table.tableNumber || "").toLowerCase().includes(q) ||
        String(table.area || "").toLowerCase().includes(q) ||
        String(table.tableType || "").toLowerCase().includes(q) ||
        String(table.floor || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? table.isActive : !table.isActive);
      const matchesFloor = floorFilter === "all" || String(table.floor || "ground") === floorFilter;
      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [diningTables, floorFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTables = filteredTables.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [floorFilter, pageSize, search, statusFilter, viewMode]);

  if (loading) {
    return <RestaurantPageLoader />;
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiGrid className="h-4 w-4" />
                Table QR Studio
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Tables & QR Codes</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Manage dine-in tables, capacity, and branded QR stands. POS takeaway and delivery channels are created
                automatically in the background and are not listed here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => fetchTables(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button type="button" onClick={() => navigate(`${portalBase}/tables/new`)}>
                <FiPlus className="mr-2" />
                Add Table
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total tables" value={metrics.total} sub={`${metrics.floors} floors/areas`} icon={FiGrid} accent="from-primary-600 to-secondary-500" />
            <MetricTile label="Active" value={metrics.active} sub={`${metrics.inactive} inactive`} icon={FiCode} accent="from-emerald-500 to-teal-500" />
            <MetricTile label="Total capacity" value={metrics.capacity} sub="Guests seated at once" icon={FiUsers} accent="from-indigo-500 to-violet-500" />
            <MetricTile label="Logo QR" value={logo ? "Ready" : "No logo"} sub={logo ? "Logo will appear in QR center" : "Add logo in settings/profile"} icon={FiImage} accent="from-amber-500 to-orange-500" />
          </div>
        </div>
      </motion.section>

      <Card
        title={`Tables (${filteredTables.length})`}
        actions={
          <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white">
            <button
              type="button"
              onClick={() => setViewMode("floor")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                viewMode === "floor" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-surface-50"
              }`}
            >
              <FiMapPin className="h-4 w-4" />
              Floor
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                viewMode === "card" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-surface-50"
              }`}
            >
              <FiGrid className="h-4 w-4" />
              Card
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                viewMode === "list" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-surface-50"
              }`}
            >
              <FiList className="h-4 w-4" />
              List
            </button>
          </div>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            icon={FiSearch}
            label="Search tables"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Table, area, floor, or type"
          />
          <div>
            <label htmlFor="table-status-filter" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              id="table-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All tables</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
          <div>
            <label htmlFor="table-floor-filter" className="mb-1 block text-sm font-medium text-gray-700">Floor / area</label>
            <select
              id="table-floor-filter"
              value={floorFilter}
              onChange={(event) => setFloorFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All floors</option>
              {floorOptions.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredTables.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex min-h-80 flex-col items-center justify-center rounded-3xl bg-surface-50 px-4 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                <FiGrid className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-950">No tables found</h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Try clearing filters or create your first table to start accepting QR orders.
              </p>
              <Button className="mt-4" onClick={() => navigate(`${portalBase}/tables/new`)}>
                <FiPlus className="mr-2" /> Add Table
              </Button>
            </motion.div>
          ) : viewMode === "floor" ? (
            <motion.div
              key="floor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FloorPlanView tables={filteredTables} onStatusChange={handleStatusChange} />
            </motion.div>
          ) : viewMode === "card" ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {paginatedTables.map((table, index) => (
                <motion.article
                  key={table._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
                  whileHover={{ y: -4 }}
                  className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-950">Table {table.tableNumber}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {table.capacity || 4} seats - {table.tableType || "regular"} - {table.posStatus || "available"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Floor {table.floor || "ground"}{table.area ? ` - ${table.area}` : ""}
                      </p>
                      <div className="mt-3">
                        <SeatStatusSelect table={table} onStatusChange={handleStatusChange} />
                      </div>
                    </div>
                    <RestaurantStatusPill value={table.isActive ? "active" : "inactive"} styles={tableStatusStyles} />
                  </div>

                  <div className="my-5 flex justify-center">
                    <QRPreview table={table} qrUrl={getQRUrl(table)} logo={logo} size={156} />
                  </div>

                  <div className="rounded-2xl bg-surface-50 p-3">
                    <p className="break-all text-center text-xs text-gray-500">{getQRUrl(table)}</p>
                  </div>

                  <div className="mt-4">
                    <TableActions
                      table={table}
                      onQr={(selected) => setQrModal({ open: true, table: selected })}
                      onRegenerate={handleRegenerateQR}
                      onEdit={(selected) => navigate(`${portalBase}/tables/${selected._id}/edit`)}
                      onDelete={handleDelete}
                      onMove={(selected) => openTransferModal("move", selected)}
                      onMerge={(selected) => openTransferModal("merge", selected)}
                    />
                  </div>
                </motion.article>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto rounded-2xl border border-surface-200"
            >
              <table className="min-w-full divide-y divide-surface-200 text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    {["Table", "Capacity", "Floor", "Type", "Seat Status", "Active", "QR", "Actions"].map((header) => (
                      <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 bg-white">
                  {paginatedTables.map((table) => (
                    <tr key={table._id} className="transition hover:bg-surface-50">
                      <td className="px-5 py-4 font-semibold text-gray-950">Table {table.tableNumber}</td>
                      <td className="px-5 py-4 text-gray-600">{table.capacity || 4} seats</td>
                      <td className="px-5 py-4 text-gray-600">{table.floor || "ground"}</td>
                      <td className="px-5 py-4 capitalize text-gray-600">{table.tableType || "regular"}</td>
                      <td className="px-5 py-4">
                        <SeatStatusSelect table={table} onStatusChange={handleStatusChange} compact />
                      </td>
                      <td className="px-5 py-4">
                        <RestaurantStatusPill value={table.isActive ? "active" : "inactive"} styles={tableStatusStyles} />
                      </td>
                      <td className="px-5 py-4">
                        <QRPreview table={table} qrUrl={getQRUrl(table)} logo={logo} size={74} />
                      </td>
                      <td className="px-5 py-4">
                        <TableActions
                          table={table}
                          onQr={(selected) => setQrModal({ open: true, table: selected })}
                          onRegenerate={handleRegenerateQR}
                          onEdit={(selected) => navigate(`${portalBase}/tables/${selected._id}/edit`)}
                          onDelete={handleDelete}
                          onMove={(selected) => openTransferModal("move", selected)}
                          onMerge={(selected) => openTransferModal("merge", selected)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {filteredTables.length > 0 && (
        <PaginationBar
          page={currentPage}
          pageSize={pageSize}
          total={filteredTables.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, table: null })}
        title={`QR Code - Table ${qrModal.table?.tableNumber || ""}`}
      >
        <div className="p-6 text-center">
          <div className="mx-auto max-w-sm rounded-3xl border border-surface-200 bg-gradient-to-b from-surface-50 to-white p-5 shadow-sm">
            {logo && (
              <img
                src={logo}
                alt={restaurant?.name || "Restaurant logo"}
                className="mx-auto mb-3 h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-md"
              />
            )}
            <h3 className="text-xl font-semibold text-gray-950">{restaurant?.name || "Restaurant"}</h3>
            <p className="mt-1 text-sm text-gray-500">Scan to view menu and order from your table</p>
            <div className="my-5 flex justify-center">
              {qrModal.table?.qrToken ? (
                <QRPreview table={qrModal.table} qrUrl={getQRUrl(qrModal.table)} logo={logo} size={236} />
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-2xl bg-surface-100 text-gray-400">
                  No QR Code Available
                </div>
              )}
            </div>
            <p className="text-lg font-semibold tracking-wide text-primary-700">
              TABLE {qrModal.table?.tableNumber || ""}
            </p>
          </div>

          {qrModal.table?.qrToken && (
            <>
              <div className="mt-4 rounded-2xl bg-surface-50 p-3">
                <p className="break-all text-xs text-gray-600">{getQRUrl(qrModal.table)}</p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getQRUrl(qrModal.table));
                    toast.success("URL copied to clipboard");
                  }}
                  variant="outline"
                  size="sm"
                >
                  <FiCopy className="mr-2" /> Copy URL
                </Button>
                <a
                  href={getQRUrl(qrModal.table)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <FiExternalLink className="mr-2" /> Open
                </a>
                <PrintQRButton qrModal={qrModal} qrUrl={getQRUrl(qrModal.table)} restaurant={restaurant} />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={transferModal.open}
        onClose={() => setTransferModal({ open: false, mode: "move", table: null, targetTableId: "" })}
        title={`${transferModal.mode === "merge" ? "Merge" : "Move"} Table ${transferModal.table?.tableNumber || ""}`}
      >
        <div className="space-y-4 p-3">
          <div className="rounded-2xl bg-surface-50 p-4">
            <p className="text-sm font-semibold text-gray-950">
              {transferModal.mode === "merge"
                ? "Merge this table's active order into another table."
                : "Move this table's active order to an empty target table."}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Source: Table {transferModal.table?.tableNumber || "-"} - {transferModal.table?.posStatus || "available"}
            </p>
          </div>
          <div>
            <label htmlFor="target-table" className="mb-1 block text-sm font-medium text-gray-700">Target table</label>
            <select
              id="target-table"
              value={transferModal.targetTableId}
              onChange={(event) => setTransferModal((prev) => ({ ...prev, targetTableId: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose table</option>
              {diningTables
                .filter((table) => String(table._id) !== String(transferModal.table?._id))
                .map((table) => (
                  <option key={table._id} value={table._id}>
                    Table {table.tableNumber} - {table.posStatus || "available"}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleTransfer}>
              {transferModal.mode === "merge" ? "Merge Tables" : "Move Order"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTransferModal({ open: false, mode: "move", table: null, targetTableId: "" })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tables;
