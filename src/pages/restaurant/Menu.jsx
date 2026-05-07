import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiGrid,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { useTenantRoutes } from "../../hooks/useTenantRoutes";
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
} from "../../components/restaurant/RestaurantUI";

const PAGE_SIZE_OPTIONS = [8, 12, 24, 48];

const availabilityStyles = {
  available: "bg-green-100 text-green-800",
  unavailable: "bg-red-100 text-red-800",
};

const getItemCategoryId = (item) => {
  if (!item?.category) return "";
  if (typeof item.category === "object" && item.category._id != null) {
    return String(item.category._id);
  }
  return String(item.category);
};

const getItemCategoryDisplayName = (item, categoriesList) => {
  if (item?.category && typeof item.category === "object" && item.category.name) {
    return item.category.name;
  }
  const id = getItemCategoryId(item);
  return categoriesList.find((c) => String(c._id) === id)?.name || "Uncategorized";
};

const getItemImage = (item) => item?.image || "";

function MenuItemImage({ item, className = "" }) {
  const image = getItemImage(item);

  if (image) {
    return (
      <img
        src={image}
        alt={item.name}
        className={`bg-surface-100 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-surface-100 to-primary-50 text-xs font-semibold text-primary-500 ${className}`}
    >
      No image
    </div>
  );
}

function MenuActions({ item, onEdit, onDelete, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onToggle(item)}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600"
        title={item.isAvailable ? "Mark as unavailable" : "Mark as available"}
      >
        {item.isAvailable ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
        title="Edit"
      >
        <FiEdit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-surface-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{start}-{end}</span> of{" "}
        <span className="font-semibold text-gray-900">{total}</span> items
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

const Menu = () => {
  const navigate = useNavigate();
  const { restaurantBase } = useTenantRoutes();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: "",
    id: "",
    name: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        api.get("/restaurant/menu/categories"),
        api.get("/restaurant/menu/items"),
      ]);
      setCategories(categoriesRes.data.data || []);
      setItems(itemsRes.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch menu data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await api.delete(`/restaurant/menu/categories/${deleteModal.id}`);
      toast.success("Category deleted successfully");
      fetchMenuData();
      setDeleteModal({ open: false, type: "", id: "", name: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  };

  const handleDeleteItem = async () => {
    try {
      await api.delete(`/restaurant/menu/items/${deleteModal.id}`);
      toast.success("Menu item deleted successfully");
      fetchMenuData();
      setDeleteModal({ open: false, type: "", id: "", name: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete menu item");
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.patch(`/restaurant/menu/items/${item._id}/toggle-availability`);
      toast.success(`Item marked as ${item.isAvailable ? "unavailable" : "available"}`);
      fetchMenuData();
    } catch (error) {
      toast.error("Failed to update item status");
    }
  };

  const categoryCounts = useMemo(() => {
    const counts = { all: items.length };
    items.forEach((item) => {
      const id = getItemCategoryId(item);
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        String(selectedCategory) === "all" || getItemCategoryId(item) === String(selectedCategory);
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" ? item.isAvailable : !item.isAvailable);
      const categoryLabel = getItemCategoryDisplayName(item, categories).toLowerCase();
      const matchesSearch =
        !query ||
        String(item.name || "").toLowerCase().includes(query) ||
        String(item.description || "").toLowerCase().includes(query) ||
        categoryLabel.includes(query);

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }, [availabilityFilter, categories, items, search, selectedCategory]);

  const availableCount = items.filter((item) => item.isAvailable).length;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [availabilityFilter, pageSize, search, selectedCategory, viewMode]);

  if (loading) {
    return <RestaurantPageLoader />;
  }

  const openDeleteModal = (type, item) => {
    setDeleteModal({
      open: true,
      type,
      id: item._id,
      name: item.name,
    });
  };

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
                Menu Studio
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Menu Management</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Organize dishes, availability, prices, and categories with a cleaner card or list workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={fetchMenuData}>
                <FiRefreshCw className="mr-2" />
                Refresh
              </Button>
              <Button type="button" onClick={() => navigate(`${restaurantBase}/menu/category/new`)}>
                <FiPlus className="mr-2" />
                Category
              </Button>
              <Button type="button" onClick={() => navigate(`${restaurantBase}/menu/item/new`)}>
                <FiPlus className="mr-2" />
                Menu Item
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Total items", value: items.length },
              { label: "Available", value: availableCount },
              { label: "Categories", value: categories.length },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-surface-200 bg-white/90 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-950">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <Card title="Categories">
        <div className="flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`min-w-40 rounded-2xl border p-4 text-left transition ${
              selectedCategory === "all"
                ? "border-primary-500 bg-primary-50 shadow-sm"
                : "border-surface-200 bg-white hover:border-primary-100 hover:bg-surface-50"
            }`}
          >
            <p className="font-semibold text-gray-950">All Items</p>
            <p className="mt-1 text-sm text-gray-500">{items.length} items</p>
          </button>

          {categories.map((category) => (
            <motion.button
              key={category._id}
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => setSelectedCategory(String(category._id))}
              className={`min-w-56 rounded-2xl border p-4 text-left transition ${
                String(selectedCategory) === String(category._id)
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-surface-200 bg-white hover:border-primary-100 hover:bg-surface-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-950">{category.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {category.description || "No description"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary-600">
                    {categoryCounts[String(category._id)] || 0} items
                  </p>
                </div>
                <div className="flex gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`${restaurantBase}/menu/category/${category._id}/edit`);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.stopPropagation();
                        navigate(`${restaurantBase}/menu/category/${category._id}/edit`);
                      }
                    }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                    title="Edit category"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      openDeleteModal("category", category);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.stopPropagation();
                        openDeleteModal("category", category);
                      }
                    }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete category"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </Card>

      <Card
        title={`Menu Items (${filteredItems.length})`}
        actions={
          <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white">
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
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <Input
            icon={FiSearch}
            label="Search menu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by dish, description, or category"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 lg:w-52"
            >
              <option value="all">All items</option>
              <option value="available">Available only</option>
              <option value="unavailable">Unavailable only</option>
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {paginatedItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                <FiSearch className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-950">No menu items found</h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Try another category, clear the search, or add a new menu item.
              </p>
            </motion.div>
          ) : viewMode === "card" ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {paginatedItems.map((item, index) => {
                const categoryLabel = getItemCategoryDisplayName(item, categories);
                const availability = item.isAvailable ? "available" : "unavailable";
                return (
                  <motion.article
                    key={item._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
                    whileHover={{ y: -4 }}
                    className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <MenuItemImage item={item} className="h-44 w-full" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-950">{item.name}</p>
                          <p className="mt-1 text-sm text-gray-500">{categoryLabel}</p>
                        </div>
                        <p className="text-lg font-bold text-primary-700">
                          {formatRestaurantCurrency(item.price)}
                        </p>
                      </div>
                      {item.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-gray-500">{item.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <RestaurantStatusPill value={availability} styles={availabilityStyles} />
                          {item.preparationTime && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                              <FiClock className="h-3.5 w-3.5" />
                              {item.preparationTime} min
                            </span>
                          )}
                        </div>
                        <MenuActions
                          item={item}
                          onEdit={() => navigate(`${restaurantBase}/menu/item/${item._id}/edit`)}
                          onDelete={() => openDeleteModal("item", item)}
                          onToggle={handleToggleAvailability}
                        />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto rounded-2xl border border-surface-200"
            >
              <table className="min-w-full divide-y divide-surface-200">
                <thead className="bg-surface-50">
                  <tr>
                    {["Item", "Category", "Price", "Prep", "Status", "Actions"].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 bg-white">
                  {paginatedItems.map((item) => {
                    const categoryLabel = getItemCategoryDisplayName(item, categories);
                    const availability = item.isAvailable ? "available" : "unavailable";
                    return (
                      <tr key={item._id} className="transition hover:bg-surface-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <MenuItemImage item={item} className="h-12 w-12 rounded-xl" />
                            <div>
                              <p className="font-semibold text-gray-950">{item.name}</p>
                              <p className="max-w-md truncate text-sm text-gray-500">
                                {item.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{categoryLabel}</td>
                        <td className="px-5 py-4 font-bold text-primary-700">
                          {formatRestaurantCurrency(item.price)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.preparationTime ? `${item.preparationTime} min` : "N/A"}
                        </td>
                        <td className="px-5 py-4">
                          <RestaurantStatusPill value={availability} styles={availabilityStyles} />
                        </td>
                        <td className="px-5 py-4">
                          <MenuActions
                            item={item}
                            onEdit={() => navigate(`${restaurantBase}/menu/item/${item._id}/edit`)}
                            onDelete={() => openDeleteModal("item", item)}
                            onToggle={handleToggleAvailability}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <PaginationBar
        page={currentPage}
        pageSize={pageSize}
        total={filteredItems.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: "", id: "", name: "" })}
        title={`Delete ${deleteModal.type === "category" ? "Category" : "Menu Item"}`}
      >
        <div className="p-6">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.name}</strong>?
            {deleteModal.type === "category" && " Items in this category will not be deleted."}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteModal({ open: false, type: "", id: "", name: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteModal.type === "category" ? handleDeleteCategory : handleDeleteItem}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;
