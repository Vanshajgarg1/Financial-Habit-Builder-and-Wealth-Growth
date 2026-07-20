"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ArrowDownLeft, 
  Loader2,
  X,
  PieChart as PieIcon,
  HelpCircle,
  TrendingDown,
  ListFilter
} from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  title: z.string().min(2, "Title / Merchant must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  payment_method: z.string().min(1, "Please select a payment method"),
  date: z.string().min(1, "Please select a date"),
  description: z.string().optional(),
  is_recurring: z.boolean().default(false),
  is_essential: z.boolean().default(true),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { user } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [essentialFilter, setEssentialFilter] = useState(""); // "", "true", "false"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      amount: 0,
      title: "",
      category: "Food",
      payment_method: "UPI",
      date: new Date().toISOString().split("T")[0],
      description: "",
      is_recurring: false,
      is_essential: true,
    },
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (paymentFilter) params.payment_method = paymentFilter;
      if (essentialFilter !== "") params.is_essential = essentialFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await api.expenses.list(params) as Expense[];
      setExpenses(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve expense history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, paymentFilter, essentialFilter, startDate, endDate]);

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setValue("amount", exp.amount);
    setValue("title", exp.title);
    setValue("category", exp.category);
    setValue("payment_method", exp.payment_method);
    setValue("date", exp.date.split("T")[0]);
    setValue("description", exp.description || "");
    setValue("is_recurring", exp.is_recurring);
    setValue("is_essential", exp.is_essential);
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingExpense(null);
    reset({
      amount: 0,
      title: "",
      category: "Food",
      payment_method: "UPI",
      date: new Date().toISOString().split("T")[0],
      description: "",
      is_recurring: false,
      is_essential: true,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    setSubmitting(true);
    try {
      if (editingExpense) {
        await api.expenses.update(editingExpense.id, data);
        toast.success("Expense entry updated successfully");
      } else {
        await api.expenses.create(data);
        toast.success("Expense entry recorded successfully");
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense entry?")) return;
    try {
      await api.expenses.delete(id);
      toast.success("Expense entry deleted");
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const essentialTotal = expenses
    .filter((e) => e.is_essential)
    .reduce((sum, item) => sum + item.amount, 0);

  const nonEssentialTotal = expenses
    .filter((e) => !e.is_essential)
    .reduce((sum, item) => sum + item.amount, 0);

  // Group by category for chart
  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, item) => sum + item.amount, 0);
    return { name: cat, value: total };
  }).filter((c) => c.value > 0);

  // Highest spending category
  const highestCategory = categoryTotals.length > 0
    ? [...categoryTotals].sort((a, b) => b.value - a.value)[0]
    : null;

  const COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#06b6d4"];

  return (
    <div className="space-y-8">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Expenses
            </span>
            <span className="block text-2xl font-bold text-slate-900">
              {formatCurrency(totalExpenses, user?.preferred_currency)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <span className="font-bold text-sm">Needs</span>
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Essential Spending
            </span>
            <span className="block text-xl font-bold text-slate-800">
              {formatCurrency(essentialTotal, user?.preferred_currency)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <span className="font-bold text-sm">Wants</span>
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Non-Essential
            </span>
            <span className="block text-xl font-bold text-slate-800">
              {formatCurrency(nonEssentialTotal, user?.preferred_currency)}
            </span>
          </div>
        </div>

        <button
          onClick={handleAddClick}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-3xl p-6 shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition flex items-center justify-center gap-2 font-bold text-lg"
        >
          <Plus className="h-6 w-6" /> Log New Expense
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table & Filters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Filter Expenses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search merchant..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="">All Payment Methods</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>

              <select
                value={essentialFilter}
                onChange={(e) => setEssentialFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="">All Essential Types</option>
                <option value="true">Essential (Needs)</option>
                <option value="false">Non-Essential (Wants)</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-4 px-6">Merchant / Title</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Payment Method</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                        Loading expenses...
                      </td>
                    </tr>
                  ) : expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                            {exp.title}
                            {exp.is_recurring && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-blue-55 text-blue-600 border border-blue-200">
                                Sub
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${
                                exp.is_essential 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}
                            >
                              {exp.is_essential ? "Need" : "Want"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-xs">{exp.payment_method}</td>
                        <td className="py-4 px-6 text-slate-500">{formatDate(exp.date)}</td>
                        <td className="py-4 px-6 text-right font-black text-slate-900">
                          {formatCurrency(exp.amount, user?.preferred_currency)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(exp)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                        No expense records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side charts */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="h-5 w-5 text-rose-600" />
              <h3 className="font-bold text-slate-800 text-base">Breakdown by Category</h3>
            </div>
            {categoryTotals.length > 0 ? (
              <div className="space-y-6">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryTotals}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value), user?.preferred_currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {highestCategory && (
                  <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-700 text-center">
                    Highest Category: {highestCategory.name} ({formatCurrency(highestCategory.value, user?.preferred_currency)})
                  </div>
                )}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categoryTotals.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {item.name}
                      </span>
                      <span className="text-slate-800 font-bold">{formatCurrency(item.value, user?.preferred_currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-10">No spending breakdown available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-lg shadow-2xl z-10">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingExpense ? "Edit Expense Entry" : "Record New Expense"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    errors.amount ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Merchant / Title
                </label>
                <input
                  type="text"
                  {...register("title")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    errors.title ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="Zomato, Uber, Landlord, Netflix, etc."
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Payment Method
                  </label>
                  <select
                    {...register("payment_method")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Spending Type
                  </label>
                  <select
                    onChange={(e) => setValue("is_essential", e.target.value === "true")}
                    defaultValue="true"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="true">Essential (Needs / Bills)</option>
                    <option value="false">Non-Essential (Wants / Leisure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={2}
                  placeholder="Purchase notes..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  {...register("is_recurring")}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-55 h-4 w-4"
                />
                <label htmlFor="is_recurring" className="text-sm font-semibold text-slate-600 cursor-pointer">
                  Is this a recurring subscription / bill?
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingExpense ? "Save Changes" : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
