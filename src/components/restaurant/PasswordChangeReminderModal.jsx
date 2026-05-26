import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "@utils/toast";
import { FiLock, FiShield, FiX } from "react-icons/fi";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";
import Input from "../common/Input";

const dismissedKeyFor = (user) =>
  `restaurant-password-reminder-dismissed:${user?.id || user?._id || user?.email || "restaurant"}`;

export default function PasswordChangeReminderModal() {
  const { user, mergeUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(dismissedKeyFor(user)) === "1";
  });
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const newPassword = watch("newPassword");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.sessionStorage.getItem(dismissedKeyFor(user)) === "1");
  }, [user?.id, user?._id, user?.email]);

  const recommendation = user?.passwordChangeRecommendation || {};
  const reminderAfterDays = recommendation.reminderAfterDays || 60;
  const reminderAfterLogins = recommendation.reminderAfterLogins || 50;
  const required = Boolean(user?.mustChangePassword || recommendation.required);
  const open = Boolean(
    user?.role === "restaurant" &&
    user?.scope !== "employee" &&
    user?.passwordChangeRecommended &&
    (required || !dismissed),
  );

  const reasonText = useMemo(() => {
    if (recommendation.reason === "age") {
      return `Your password reached the configured ${reminderAfterDays}-day security limit.`;
    }
    if (recommendation.reason === "logins") {
      return `Your password reached the configured ${reminderAfterLogins} successful-login security limit.`;
    }
    return "It is a good time to refresh your restaurant password.";
  }, [
    recommendation.reason,
    reminderAfterDays,
    reminderAfterLogins,
  ]);

  const dismiss = () => {
    if (required) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(dismissedKeyFor(user), "1");
    }
    setDismissed(true);
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await api.post("/restaurant/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      mergeUser({
        passwordChangeRecommended: false,
        mustChangePassword: false,
        passwordChangeRecommendation: {
          recommended: false,
          required: false,
          reason: null,
          passwordAgeDays: 0,
          successfulLoginCount: 0,
          reminderAfterDays: recommendation.reminderAfterDays,
          reminderAfterLogins: recommendation.reminderAfterLogins,
          passwordChangedAt: new Date().toISOString(),
        },
      });
      reset();
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <FiShield className="h-6 w-6" />
          </div>
          {!required && (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>

        <h2 className="mt-4 text-xl font-semibold text-gray-950 dark:text-gray-100">
          {required ? "Password change required" : "Update your password"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {reasonText}{" "}
          {required
            ? "You must change it before continuing."
            : "Changing it now helps protect orders, billing, staff access, and restaurant settings."}
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary-50 px-3 py-3 text-sm text-primary-800 dark:bg-gray-800 dark:text-primary-200">
          <FiLock className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            We recommend changing restaurant passwords every{" "}
            {reminderAfterDays} days or after {reminderAfterLogins} successful
            login(s).
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Input
            label="Current Password"
            type="password"
            autoComplete="current-password"
            {...register("currentPassword", {
              required: "Current password is required",
            })}
            error={errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
            error={errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            })}
            error={errors.confirmPassword?.message}
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" loading={saving} className="w-full">
              Change password
            </Button>
            {!required && (
              <Button type="button" variant="outline" onClick={dismiss}>
                Later
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
