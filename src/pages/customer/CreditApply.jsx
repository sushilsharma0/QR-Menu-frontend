import React, { useEffect, useState } from "react";
import { ArrowLeft, Mail, User, Phone } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";
import { applyRestaurantCreditAccount, ensureGuestSession } from "../../services/customer";
import toast from "@utils/toast";

export default function CreditApply() {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [guestId, setGuestId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  useEffect(() => {
    if (!token) return;
    ensureGuestSession(token)
      .then((s) => setGuestId(s.guestId || ""))
      .catch(() => {});
  }, [token]);

  const submit = async () => {
    if (!guestId || !slug || !token) {
      toast.error("Session not ready — open this page from your table QR.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    try {
      setBusy(true);
      const res = await applyRestaurantCreditAccount({
        qrToken: token,
        guestId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      const st = res?.data?.status;
      if (st === "already_approved") toast.success("Your account is already approved — you can use credit at checkout.");
      else toast.success("Application sent. The restaurant will review and email you.");
      navigate(`/cart/${slug}/${token}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not submit application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-4 pt-12 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <button
          type="button"
          className="rounded-xl bg-gray-100 p-2 dark:bg-gray-800"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black">House credit application</h1>
          <p className="text-[11px] font-semibold text-gray-400">Restaurant must approve before you can use “Pay later”.</p>
        </div>
      </header>

      <div className="mx-5 mt-6 space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
          Full name
          <div className="relative mt-1">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </label>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
          Email (notifications & verification)
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </label>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
          Phone
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
        <p className="text-center text-[10px] font-semibold text-gray-400">
          Guest checkout stays available without an account. This is optional for regulars.
        </p>
      </div>

      <Navigation />
    </div>
  );
}
