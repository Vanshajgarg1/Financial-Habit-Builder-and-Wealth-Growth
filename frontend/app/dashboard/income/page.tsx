"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Income, INCOME_CATEGORIES } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  Loader2,
  X,
  PieChart as PieIcon,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const incomeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  source: z.string().min(2, "Source must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  date: z.string().min(1, "Please select a date"),
  description: z.string().optional(),
  is_recurring: z.boolean().default(false),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function IncomePage() {
  const { user } = useUser();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: {
      amount: 0,
      source: "",
      category: "Salary",
      date: new Date().toISOString().split("T")[0],
      description: "",
      is_recurring: false,
    },
  });

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await api.income.list(params) as Income[];
      setIncomes(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve income history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [search, categoryFilter, startDate, endDate]);

  // Open modal for editing
  const handleEdit = (inc: Income) => {
    setEditingIncome(inc);
    setValue("amount", inc.amount);
    setValue("source", inc.source);
    setValue("category", inc.category);
    setValue("date", inc.date.split("T")[0]);
    setValue("description", inc.description || "");
    setValue("is_recurring", inc.is_recurring);
    setModalOpen(true);
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingIncome(null);
    reset({
      amount: 0,
      source: "",
      category: "Salary",
      date: new Date().toISOString().split("T")[0],
      description: "",
      is_recurring: false,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: IncomeFormValues) => {
    setSubmitting(true);
    try {
      if (editingIncome) {
        await api.income.update(editingIncome.id, data);
        toast.success("Income entry updated successfully");
      } else {
        await api.income.create(data);
        toast.success("Income entry recorded successfully");
      }
      setModalOpen(false);
      fetchIncomes();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this income entry?")) return;
    try {
      await api.income.delete(id);
      toast.success("Income entry deleted");
      fetchIncomes();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Calculations
  const totalMonthlyIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

  // Group by category for chart
  const categoryTotals = INCOME_CATEGORIES.map((cat) => {
    const total = incomes
      .filter((inc) => inc.category === cat)
      .reduce((sum, item) => sum + item.amount, 0);
    return { name: cat, value: total };
  }).filter((c) => c.value > 0);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];

  return (
    <div className="space-y-8">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Listed Income
            </span>
            <span className="block text-2xl font-bold text-slate-900">
              {formatCurrency(totalMonthlyIncome, user?.preferred_currency)}
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Record Count
            </span>
            <span className="block text-2xl font-bold text-slate-900">{incomes.length} source(s)</span>
          </div>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition flex items-center justify-center gap-2 font-bold text-lg"
        >
          <Plus className="h-6 w-6" /> Log New Income
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Filters and Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Search & Filter Income</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search source..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">All Categories</option>
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-4 px-6">Source</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                        Loading incomes...
                      </td>
                    </tr>
                  ) : incomes.length > 0 ? (
                    incomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {inc.source}
                          {inc.is_recurring && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700">
                              Recurring
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                            {inc.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500">{formatDate(inc.date)}</td>
                        <td className="py-4 px-6 text-right font-black text-slate-900">
                          {formatCurrency(inc.amount, user?.preferred_currency)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(inc)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inc.id)}
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
                      <td colSpan={5} className="py-20 text-center text-slate-400 italic">
                        No income records found match these criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Category Breakdown Chart */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="h-5 w-5 text-emerald-600" />
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
              <div className="space-y-2">
                {categoryTotals.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="text-slate-800">{formatCurrency(item.value, user?.preferred_currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-10">No charts available. Start by logging an income entry.</p>
          )}
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
              {editingIncome ? "Edit Income Record" : "Record New Income"}
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
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
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
                  Source / Title
                </label>
                <input
                  type="text"
                  {...register("source")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.source ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="TechCorp, Web Freelance, etc."
                />
                {errors.source && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.source.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {INCOME_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Add notes about this transaction..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  {...register("is_recurring")}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="is_recurring" className="text-sm font-semibold text-slate-600 cursor-pointer">
                  Is this a recurring monthly income?
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingIncome ? "Save Changes" : "Record Income"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
