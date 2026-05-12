import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiSave, FiSearch, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  createRecipe,
  updateRecipe,
  getRecipeByMenuItem,
  deleteRecipe,
  searchRecipeInventory,
} from "../../services/api";

/** Must match server `InventoryItem.INVENTORY_UNITS` — same set so any
 *  inventory item can be used in a recipe regardless of how it's stocked. */
export const RECIPE_UNITS = [
  "kg",
  "gram",
  "liter",
  "ml",
  "piece",
  "packet",
  "bottle",
  "carton",
  "box",
  "other",
];

function newRowKey() {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function MenuRecipeModal({ isOpen, onClose, menuItem, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState("none");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const menuItemId = menuItem?._id ? String(menuItem._id) : null;

  const resetLocal = useCallback(() => {
    setSource("none");
    setRows([]);
    setSearch("");
    setSearchResults([]);
  }, []);

  const loadRecipe = useCallback(async () => {
    if (!menuItemId) return;
    try {
      setLoading(true);
      const res = await getRecipeByMenuItem(menuItemId);
      const payload = res.data?.data;
      setSource(payload?.source || "none");
      const ing = payload?.ingredients || [];
      setRows(
        ing.map((line) => {
          const inv = line.inventoryItem;
          const id = inv?._id != null ? String(inv._id) : String(line.inventoryItem || "");
          return {
            key: newRowKey(),
            inventoryItemId: id,
            name: inv?.name || "Ingredient",
            quantity: line.quantity != null ? String(line.quantity) : "",
            unit: line.unit || inv?.unit || "piece",
          };
        }),
      );
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load recipe");
      resetLocal();
    } finally {
      setLoading(false);
    }
  }, [menuItemId, resetLocal]);

  useEffect(() => {
    if (!isOpen || !menuItemId) {
      resetLocal();
      return;
    }
    loadRecipe();
  }, [isOpen, menuItemId, loadRecipe, resetLocal]);

  useEffect(() => {
    if (!isOpen || !search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchRecipeInventory({ q: search.trim() });
        setSearchResults(res.data?.data?.items || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => clearTimeout(t);
  }, [search, isOpen]);

  const usedIds = useMemo(() => new Set(rows.map((r) => r.inventoryItemId).filter(Boolean)), [rows]);

  const addIngredient = (inv) => {
    const id = String(inv._id);
    if (usedIds.has(id)) {
      toast.error("That ingredient is already in the recipe");
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        key: newRowKey(),
        inventoryItemId: id,
        name: inv.name,
        quantity: "",
        unit: inv.unit || "piece",
      },
    ]);
    setSearch("");
    setSearchResults([]);
  };

  const updateRow = (key, patch) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSave = async () => {
    if (!menuItemId) return;
    const ingredients = [];
    for (const r of rows) {
      const qty = Number(r.quantity);
      if (!r.inventoryItemId) continue;
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(`Enter a valid quantity for ${r.name}`);
        return;
      }
      if (!RECIPE_UNITS.includes(r.unit)) {
        toast.error("Invalid unit on a line");
        return;
      }
      ingredients.push({
        inventoryItemId: r.inventoryItemId,
        quantity: qty,
        unit: r.unit,
      });
    }

    if (ingredients.length === 0) {
      toast.error("Add at least one ingredient with quantity");
      return;
    }

    try {
      setSaving(true);
      if (source === "recipe") {
        await updateRecipe(menuItemId, { ingredients });
        toast.success("Recipe updated");
      } else {
        await createRecipe({ menuItemId, ingredients });
        toast.success("Recipe saved");
      }
      onSaved?.();
      onClose();
    } catch (e) {
      // The server returns 422 with { errors: [{ field, message }, …] } when
      // a line fails validation (e.g. unit mismatch with the inventory item).
      // Surface the first specific message so the admin knows which row to fix.
      const data = e.response?.data || {};
      const fieldErr = Array.isArray(data.errors) && data.errors[0]?.message;
      const codeHint =
        data.code === "unit_mismatch"
          ? " — recipe unit can't be converted to how the inventory item is stored."
          : data.code === "unit_must_match_inventory"
          ? " — when inventory unit is \"other\", the recipe unit must also be \"other\"."
          : "";
      toast.error((fieldErr || data.message || "Could not save recipe") + codeHint);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!menuItemId) return;
    if (!window.confirm("Remove this recipe from the menu item? Stock will no longer deduct for this dish.")) {
      return;
    }
    try {
      setSaving(true);
      await deleteRecipe(menuItemId);
      toast.success("Recipe removed");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete recipe");
    } finally {
      setSaving(false);
    }
  };

  const title = menuItem?.name ? `Recipe — ${menuItem.name}` : "Recipe";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading recipe…</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Link inventory items and quantities per serving. Units can differ from how stock is stored when
              conversion is supported (e.g. kg ↔ gram).
            </p>

            <div className="relative mt-4">
              <div className="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <FiSearch className="h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ingredients by name…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                {searching && <span className="text-xs text-gray-400">Searching…</span>}
              </div>
              {search.trim() && searchResults.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-surface-200 bg-white py-1 shadow-lg">
                  {searchResults.map((inv) => (
                    <li key={inv._id}>
                      <button
                        type="button"
                        onClick={() => addIngredient(inv)}
                        className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-surface-50"
                      >
                        <span className="font-medium text-gray-900">{inv.name}</span>
                        <span className="text-xs text-gray-500">
                          {inv.category} · stock: {inv.quantity} {inv.unit}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {rows.length === 0 && (
                <p className="rounded-xl border border-dashed border-surface-200 bg-surface-50/80 px-4 py-6 text-center text-sm text-gray-500">
                  No ingredients yet. Search above to add items from inventory.
                </p>
              )}
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="flex flex-wrap items-end gap-3 rounded-xl border border-surface-200 bg-white p-3"
                >
                  <div className="min-w-[160px] flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ingredient</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{r.name}</p>
                  </div>
                  <div className="w-28">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={r.quantity}
                      onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="w-36">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit</label>
                    <select
                      value={r.unit}
                      onChange={(e) => updateRow(r.key, { unit: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      {RECIPE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(r.key)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove line"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 pt-4">
              <div className="flex flex-wrap gap-2">
                {(source === "recipe" || source === "legacy" || rows.length > 0) && (
                  <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={handleDeleteRecipe}>
                    Remove recipe
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={saving || loading}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5"
                >
                  <FiSave className="h-4 w-4" />
                  {saving ? "Saving…" : "Save recipe"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
