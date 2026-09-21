
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Globe,
  Moon,
  Package,
  Plus,
  Search,
  Sun,
  XCircle,
} from "lucide-react";

type Language = "en" | "ar";

type InventoryItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  price: number;
};

const initialItems: InventoryItem[] = [
  {
    id: 1,
    name: "Composite Resin",
    category: "Dental Materials",
    quantity: 24,
    unit: "Syringes",
    minQuantity: 10,
    price: 450,
  },
  {
    id: 2,
    name: "Latex Gloves",
    category: "Medical Supplies",
    quantity: 8,
    unit: "Boxes",
    minQuantity: 10,
    price: 180,
  },
  {
    id: 3,
    name: "Dental Anesthetic",
    category: "Anesthesia",
    quantity: 35,
    unit: "Cartridges",
    minQuantity: 15,
    price: 320,
  },
  {
    id: 4,
    name: "Cotton Rolls",
    category: "Medical Supplies",
    quantity: 0,
    unit: "Packs",
    minQuantity: 10,
    price: 95,
  },
  {
    id: 5,
    name: "Dental Impression Material",
    category: "Dental Materials",
    quantity: 14,
    unit: "Packs",
    minQuantity: 8,
    price: 390,
  },
  {
    id: 6,
    name: "Surface Disinfectant",
    category: "Cleaning",
    quantity: 6,
    unit: "Bottles",
    minQuantity: 8,
    price: 210,
  },
];

const getStockStatus = (item: InventoryItem) => {
  if (item.quantity === 0) {
    return "out";
  }

  if (item.quantity <= item.minQuantity) {
    return "low";
  }

  return "available";
};

const Inventory = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language");

    return savedLanguage === "ar" ? "ar" : "en";
  });

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const isArabic = language === "ar";

  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Dental Materials",
    quantity: "",
    unit: "Pieces",
    minQuantity: "",
    price: "",
  });

  useEffect(() => {
    localStorage.setItem("language", language);

    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isArabic]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleLanguage = () => {
    setLanguage((previous) => (previous === "ar" ? "en" : "ar"));
  };

  const toggleTheme = () => {
    setIsDark((previous) => !previous);
  };

  const statistics = useMemo(() => {
    const available = items.filter(
      (item) => getStockStatus(item) === "available"
    ).length;

    const low = items.filter(
      (item) => getStockStatus(item) === "low"
    ).length;

    const out = items.filter(
      (item) => getStockStatus(item) === "out"
    ).length;

    const totalValue = items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );

    return {
      total: items.length,
      available,
      low,
      out,
      totalValue,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const status = getStockStatus(item);

      const matchesFilter =
        filter === "all" ||
        (filter === "available" && status === "available") ||
        (filter === "low" && status === "low") ||
        (filter === "out" && status === "out");

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  const handleAddItem = () => {
    const quantity = Number(newItem.quantity);
    const minQuantity = Number(newItem.minQuantity);
    const price = Number(newItem.price);

    if (
      !newItem.name.trim() ||
      !newItem.quantity ||
      !newItem.minQuantity ||
      !newItem.price
    ) {
      return;
    }

    const item: InventoryItem = {
      id: Date.now(),
      name: newItem.name.trim(),
      category: newItem.category,
      quantity,
      unit: newItem.unit,
      minQuantity,
      price,
    };

    setItems((previous) => [item, ...previous]);

    setNewItem({
      name: "",
      category: "Dental Materials",
      quantity: "",
      unit: "Pieces",
      minQuantity: "",
      price: "",
    });

    setShowAddModal(false);
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen p-4 transition-colors duration-300 sm:p-6 lg:p-8 ${
        isDark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Top Controls */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isArabic ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}

            {isArabic ? "رجوع" : "Back"}
          </button>

          {/* Page Controls */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={isArabic ? "تغيير اللغة" : "Change language"}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>{isArabic ? "EN" : "AR"}</span>
            </button>

            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-600">
              <Package className="h-4 w-4" />

              <span>
                {isArabic ? "إدارة العيادة" : "Clinic Management"}
              </span>
            </div>

            <h1
              className={`text-2xl font-bold sm:text-3xl ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {isArabic ? "المخزون" : "Inventory"}
            </h1>

            <p
              className={`mt-1 text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {isArabic
                ? "إدارة مواد الأسنان والمستلزمات الطبية ومخزون العيادة."
                : "Manage dental materials, medical supplies and clinic stock."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="h-5 w-5" />

            {isArabic ? "إضافة منتج" : "Add Product"}
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isArabic ? "إجمالي المنتجات" : "Total Products"}
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {statistics.total}
                </p>
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                <Boxes className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isArabic ? "متوفر" : "Available"}
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {statistics.available}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isArabic ? "مخزون منخفض" : "Low Stock"}
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {statistics.low}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isArabic ? "نفد من المخزون" : "Out of Stock"}
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {statistics.out}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-teal-50">
                {isArabic ? "القيمة الحالية للمخزون" : "Current Inventory Value"}
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                EGP {statistics.totalValue.toLocaleString()}
              </h2>

              <p className="mt-1 text-sm text-teal-50">
                {isArabic
                  ? "القيمة التقديرية لجميع المنتجات المتاحة."
                  : "Estimated value of all available stock"}
              </p>
            </div>

            <div className="hidden rounded-2xl bg-white/10 p-4 sm:block">
              <CircleDollarSign className="h-10 w-10" />
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${
                  isArabic ? "right-4" : "left-4"
                } ${isDark ? "text-slate-500" : "text-slate-400"}`}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isArabic ? "ابحث عن المنتجات..." : "Search products..."
                }
                className={`w-full rounded-xl border py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                  isArabic ? "pl-4 pr-12" : "pl-12 pr-4"
                } ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    : "border-slate-200 bg-slate-50 text-slate-900"
                }`}
              />
            </div>

            <div className="relative min-w-[190px]">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-200"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                } ${isArabic ? "pl-10" : "pr-10"}`}
              >
                <option value="all">
                  {isArabic ? "كل المنتجات" : "All Products"}
                </option>

                <option value="available">
                  {isArabic ? "متوفر" : "Available"}
                </option>

                <option value="low">
                  {isArabic ? "مخزون منخفض" : "Low Stock"}
                </option>

                <option value="out">
                  {isArabic ? "نفد من المخزون" : "Out of Stock"}
                </option>
              </select>

              <ChevronDown
                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                  isArabic ? "left-4" : "right-4"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className={`overflow-hidden rounded-2xl border shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr
                  className={`border-b ${
                    isDark
                      ? "border-slate-800 bg-slate-800/60"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isArabic ? "text-right" : "text-left"
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {isArabic ? "المنتج" : "Product"}
                  </th>

                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isArabic ? "text-right" : "text-left"
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {isArabic ? "الفئة" : "Category"}
                  </th>

                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isArabic ? "text-right" : "text-left"
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {isArabic ? "الكمية" : "Quantity"}
                  </th>

                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isArabic ? "text-right" : "text-left"
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {isArabic ? "الحد الأدنى" : "Minimum"}
                  </th>

                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isArabic ? "text-right" : "text-left"
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {isArabic ? "سعر الوحدة" : "Unit Price"}
                  </th>

                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isArabic ? "text-right" : "text-left"
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {isArabic ? "الحالة" : "Status"}
                  </th>
                </tr>
              </thead>

              <tbody
                className={
                  isDark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"
                }
              >
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className={`px-6 py-12 text-center text-sm ${
                        isDark ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {isArabic ? "لم يتم العثور على منتجات." : "No products found."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item);

                    return (
                      <tr
                        key={item.id}
                        className={`transition ${
                          isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                              <Package className="h-5 w-5" />
                            </div>

                            <div>
                              <p
                                className={`font-semibold ${
                                  isDark ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {item.name}
                              </p>

                              <p
                                className={`mt-1 text-xs ${
                                  isDark ? "text-slate-500" : "text-slate-400"
                                }`}
                              >
                                ID #{item.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          className={`px-6 py-5 text-sm ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {item.category}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`font-semibold ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {item.quantity}
                          </span>

                          <span
                            className={`ml-1 text-sm ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {item.unit}
                          </span>
                        </td>

                        <td
                          className={`px-6 py-5 text-sm ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {item.minQuantity} {item.unit}
                        </td>

                        <td
                          className={`px-6 py-5 text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          EGP {item.price.toLocaleString()}
                        </td>

                        <td className="px-6 py-5">
                          {status === "available" && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {isArabic ? "متوفر" : "Available"}
                            </span>
                          )}

                          {status === "low" && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              {isArabic ? "مخزون منخفض" : "Low Stock"}
                            </span>
                          )}

                          {status === "out" && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                              <span className="h-2 w-2 rounded-full bg-red-50" />
                              {isArabic ? "نفد من المخزون" : "Out of Stock"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
          >
            <div
              className={`flex items-center justify-between border-b px-6 py-5 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div>
                <h2
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {isArabic ? "إضافة منتج" : "Add Product"}
                </h2>

                <p
                  className={`mt-1 text-sm ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isArabic
                    ? "أضف منتجًا جديدًا إلى مخزون العيادة."
                    : "Add a new item to your clinic inventory."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`rounded-lg p-2 transition ${
                  isDark
                    ? "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {isArabic ? "اسم المنتج" : "Product Name"}
                </label>

                <input
                  type="text"
                  value={newItem.name}
                  onChange={(event) =>
                    setNewItem({
                      ...newItem,
                      name: event.target.value,
                    })
                  }
                  placeholder={
                    isArabic ? "مثال: Composite Resin" : "e.g. Composite Resin"
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {isArabic ? "الفئة" : "Category"}
                  </label>

                  <select
                    value={newItem.category}
                    onChange={(event) =>
                      setNewItem({
                        ...newItem,
                        category: event.target.value,
                      })
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <option>Dental Materials</option>
                    <option>Medical Supplies</option>
                    <option>Anesthesia</option>
                    <option>Cleaning</option>
                    <option>Equipment</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {isArabic ? "الوحدة" : "Unit"}
                  </label>

                  <select
                    value={newItem.unit}
                    onChange={(event) =>
                      setNewItem({
                        ...newItem,
                        unit: event.target.value,
                      })
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <option>Pieces</option>
                    <option>Boxes</option>
                    <option>Packs</option>
                    <option>Bottles</option>
                    <option>Syringes</option>
                    <option>Cartridges</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {isArabic ? "الكمية" : "Quantity"}
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(event) =>
                      setNewItem({
                        ...newItem,
                        quantity: event.target.value,
                      })
                    }
                    placeholder="0"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {isArabic ? "الحد الأدنى" : "Minimum"}
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={newItem.minQuantity}
                    onChange={(event) =>
                      setNewItem({
                        ...newItem,
                        minQuantity: event.target.value,
                      })
                    }
                    placeholder="0"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {isArabic ? "سعر الوحدة" : "Unit Price"}
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={newItem.price}
                    onChange={(event) =>
                      setNewItem({
                        ...newItem,
                        price: event.target.value,
                      })
                    }
                    placeholder="EGP"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className={`flex justify-end gap-3 border-t px-6 py-5 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={handleAddItem}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {isArabic ? "إضافة المنتج" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;




