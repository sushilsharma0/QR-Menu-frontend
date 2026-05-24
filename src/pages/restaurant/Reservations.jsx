import React, { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiUsers } from "react-icons/fi";
import toast from "@utils/toast";
import api from "../../services/api";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { RestaurantPageLoader } from "../../components/restaurant/RestaurantUI";

const emptyForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  partySize: 2,
  reservationAt: "",
  durationMinutes: 90,
  table: "",
  status: "pending",
  notes: "",
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  seated: "bg-sky-100 text-sky-800",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-200 text-gray-800",
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [modal, setModal] = useState({ open: false, reservation: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      const status = statusFilter === "active" ? "pending,confirmed,seated" : statusFilter;
      const [reservationRes, tableRes] = await Promise.all([
        api.get("/restaurant/reservations", { params: { status, search: search || undefined } }),
        api.get("/restaurant/tables"),
      ]);
      setReservations(reservationRes?.data?.data || []);
      setTables(tableRes?.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const metrics = useMemo(() => ({
    today: reservations.filter((row) => new Date(row.reservationAt).toDateString() === new Date().toDateString()).length,
    pending: reservations.filter((row) => row.status === "pending").length,
    confirmed: reservations.filter((row) => row.status === "confirmed").length,
    guests: reservations.reduce((sum, row) => sum + Number(row.partySize || 0), 0),
  }), [reservations]);

  const openCreate = () => {
    const next = new Date(Date.now() + 60 * 60 * 1000);
    next.setMinutes(0, 0, 0);
    setForm({ ...emptyForm, reservationAt: toInputDateTime(next) });
    setModal({ open: true, reservation: null });
  };

  const openEdit = (reservation) => {
    setForm({
      customerName: reservation.customerName || "",
      customerPhone: reservation.customerPhone || "",
      customerEmail: reservation.customerEmail || "",
      partySize: reservation.partySize || 2,
      reservationAt: toInputDateTime(reservation.reservationAt),
      durationMinutes: reservation.durationMinutes || 90,
      table: reservation.table?._id || "",
      status: reservation.status || "pending",
      notes: reservation.notes || "",
    });
    setModal({ open: true, reservation });
  };

  const saveReservation = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        partySize: Number(form.partySize || 1),
        durationMinutes: Number(form.durationMinutes || 90),
        table: form.table || null,
      };
      if (modal.reservation?._id) {
        await api.put(`/restaurant/reservations/${modal.reservation._id}`, payload);
        toast.success("Reservation updated");
      } else {
        await api.post("/restaurant/reservations", payload);
        toast.success("Reservation created");
      }
      setModal({ open: false, reservation: null });
      fetchData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save reservation");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (reservation, status) => {
    try {
      await api.put(`/restaurant/reservations/${reservation._id}`, { status });
      toast.success(`Reservation marked ${status.replace("_", " ")}`);
      fetchData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update reservation");
    }
  };

  const deleteReservation = async (reservation) => {
    try {
      await api.delete(`/restaurant/reservations/${reservation._id}`);
      toast.success("Reservation deleted");
      fetchData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete reservation");
    }
  };

  if (loading) return <RestaurantPageLoader />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
              <FiCalendar /> Reservation Desk
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-gray-950">Reservations</h1>
            <p className="mt-1 text-sm text-gray-500">Book tables, confirm guests, and turn reservations into seated service.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => fetchData(true)} disabled={refreshing}>
              <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <FiPlus className="mr-2" /> New Reservation
            </Button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Today", metrics.today, FiCalendar],
            ["Pending", metrics.pending, FiClock],
            ["Confirmed", metrics.confirmed, FiCheck],
            ["Guests", metrics.guests, FiUsers],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-gray-950">{value}</p>
                <Icon className="text-primary-600" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Card title={`Reservations (${reservations.length})`}>
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input icon={FiSearch} label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, or email" />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">Active</option>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={() => fetchData(true)}>Apply</Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-200">
          <table className="min-w-full divide-y divide-surface-200 text-sm">
            <thead className="bg-surface-50">
              <tr>
                {["Guest", "Time", "Party", "Table", "Status", "Actions"].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {reservations.map((reservation) => (
                <tr key={reservation._id} className="hover:bg-surface-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-950">{reservation.customerName}</p>
                    <p className="text-xs text-gray-500">{reservation.customerPhone || reservation.customerEmail || "No contact"}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{new Date(reservation.reservationAt).toLocaleString()}</td>
                  <td className="px-5 py-4 font-semibold text-gray-700">{reservation.partySize}</td>
                  <td className="px-5 py-4 text-gray-700">{reservation.table ? `Table ${reservation.table.tableNumber}` : "Unassigned"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${statusStyles[reservation.status] || statusStyles.pending}`}>
                      {reservation.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {["confirmed", "seated", "completed", "no_show"].map((status) => (
                        <button key={status} disabled={reservation.status === status} onClick={() => updateStatus(reservation, status)} className="rounded-lg border border-surface-200 px-2 py-1 text-xs font-bold capitalize text-gray-600 hover:bg-white disabled:opacity-40">
                          {status.replace("_", " ")}
                        </button>
                      ))}
                      <button onClick={() => openEdit(reservation)} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" title="Edit"><FiEdit2 /></button>
                      <button onClick={() => deleteReservation(reservation)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" title="Delete"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">No reservations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, reservation: null })} title={modal.reservation ? "Edit Reservation" : "New Reservation"}>
        <form onSubmit={saveReservation} className="space-y-4 p-2">
          <Input label="Customer name" value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} required />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Phone" value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} />
            <Input label="Email" type="email" value={form.customerEmail} onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))} />
            <Input label="Party size" type="number" min="1" value={form.partySize} onChange={(e) => setForm((p) => ({ ...p, partySize: e.target.value }))} />
            <Input label="Duration minutes" type="number" min="15" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} />
          </div>
          <Input label="Reservation time" type="datetime-local" value={form.reservationAt} onChange={(e) => setForm((p) => ({ ...p, reservationAt: e.target.value }))} required />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Table</label>
              <select value={form.table} onChange={(e) => setForm((p) => ({ ...p, table: e.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Unassigned</option>
                {tables.map((table) => (
                  <option key={table._id} value={table._id}>Table {table.tableNumber} ({table.capacity || 4})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                {Object.keys(statusStyles).map((status) => (
                  <option key={status} value={status}>{status.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="min-h-[88px] w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" loading={saving}>{modal.reservation ? "Update" : "Create"} Reservation</Button>
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, reservation: null })}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reservations;
