"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Investment, INVESTMENT_TYPES } from "@/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  LineChart, 
  Loader2,
  X,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const investmentSchema = z.object({
  name: z.string().min(2, "Investment name must be at least 2 characters"),
  investment_type: z.string().min(1, "Please select an investment type"),
  amount_invested: z.coerce.number().nonnegative("Amount invested cannot be negative"),
  current_value: z.coerce.number().nonnegative("Current value cannot be negative"),
  purchase_date: z.string().min(1, "Please select a date"),
  notes: z.string().optional(),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

export default function InvestmentsPage() {
  const { user } = useUser();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: {
      name: "",
      investment_type: "Stocks",
      amount_invested: 0,
      current_value: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const data = await api.investments.list() as Investment[];
      setInvestments(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleEdit = (inv: Investment) => {
    setEditingInvestment(inv);
    setValue("name", inv.name);
    setValue("investment_type", inv.investment_type);
    setValue("amount_invested", inv.amount_invested);
    setValue("current_value", inv.current_value);
    setValue("purchase_date", inv.purchase_date.split("T")[0]);
    setValue("notes", inv.notes || "");
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingInvestment(null);
    reset({
      name: "",
      investment_type: "Stocks",
      amount_invested: 0,
      current_value: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: InvestmentFormValues) => {
    setSubmitting(true);
    try {
      if (editingInvestment) {
        await api.investments.update(editingInvestment.id, data);
        toast.success("Investment updated successfully");
      } else {
        await api.investments.create(data);
        toast.success("Investment added to portfolio");
      }
      setModalOpen(false);
      fetchInvestments();
    } catch (err: any) {
      toast.error(err.message || "Failed to save investment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;
    try {
      await api.investments.delete(id);
      toast.success("Investment removed from portfolio");
      fetchInvestments();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Calculations
  const totalInvested = investments.reduce((sum, item) => sum + item.amount_invested, 0);
  const currentValue = investments.reduce((sum, item) => sum + item.current_value, 0);
  const totalProfitLoss = currentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Group by type for Allocation Chart
  const typeAllocation = INVESTMENT_TYPES.map((type) => {
    const total = investments
      .filter((inv) => inv.investment_type === type)
      .reduce((sum, item) => sum + item.current_value, 0);
    return { name: type, value: total };
  }).filter((t) => t.value > 0);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];

  return (
    <div className="space-y-8">
      {/* Overview Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Invested Principal
          </span>
          <span className="block text-2xl font-bold text-slate-900">
            {formatCurrency(totalInvested, user?.preferred_currency)}
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Current Valuation
          </span>
          <span className="block text-2xl font-bold text-slate-900">
            {formatCurrency(currentValue, user?.preferred_currency)}
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Profit / Loss
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {totalProfitLoss >= 0 ? (
              <span className="text-2xl font-extrabold text-emerald-600 inline-flex items-center gap-1">
                <ArrowUpRight className="h-5 w-5" />
                +{formatCurrency(totalProfitLoss, user?.preferred_currency)}
              </span>
            ) : (
              <span className="text-2xl font-extrabold text-rose-600 inline-flex items-center gap-1">
                <ArrowDownRight className="h-5 w-5" />
                {formatCurrency(totalProfitLoss, user?.preferred_currency)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition flex items-center justify-center gap-2 font-bold text-lg"
        >
          <Plus className="h-6 w-6" /> Add Investment
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-4 px-6">Asset Name</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6 text-right">Invested</th>
                    <th className="py-4 px-6 text-right">Current Value</th>
                    <th className="py-4 px-6 text-right">Profit / Loss</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                        Loading portfolio investments...
                      </td>
                    </tr>
                  ) : investments.length > 0 ? (
                    investments.map((inv) => {
                      const isProfit = inv.profit_loss >= 0;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-bold text-slate-800 block">{inv.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                Purchased: {formatDate(inv.purchase_date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                              {inv.investment_type}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-slate-600 font-medium">
                            {formatCurrency(inv.amount_invested, user?.preferred_currency)}
                          </td>
                          <td className="py-4 px-6 text-right text-slate-900 font-bold">
                            {formatCurrency(inv.current_value, user?.preferred_currency)}
                          </td>
                          <td className="py-4 px-6 text-right font-black">
                            <div className="inline-flex flex-col items-end">
                              <span className={isProfit ? "text-emerald-600" : "text-rose-600"}>
                                {isProfit ? "▲" : "▼"} {formatCurrency(Math.abs(inv.profit_loss), user?.preferred_currency)}
                              </span>
                              <span className={`text-[10px] ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                                ({isProfit ? "+" : ""}{inv.return_percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(inv)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                        No portfolio assets listed yet. Let&apos;s start by adding one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side breakdown */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Asset Allocation</h3>
          </div>
          {typeAllocation.length > 0 ? (
            <div className="space-y-6">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {typeAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), user?.preferred_currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {typeAllocation.map((item, index) => (
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
            <p className="text-xs text-slate-400 italic text-center py-10">No portfolio breakdown available.</p>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
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
              {editingInvestment ? "Update Asset Valuation" : "Record New Investment"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Asset / Holding Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.name ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="e.g. Axis Bluechip ETF, Infosys Stock, Digital Gold"
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Investment Type
                  </label>
                  <select
                    {...register("investment_type")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {INVESTMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    {...register("purchase_date")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Invested Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("amount_invested")}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.amount_invested ? "border-rose-300" : "border-slate-200"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.amount_invested && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.amount_invested.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Current Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("current_value")}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.current_value ? "border-rose-300" : "border-slate-200"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.current_value && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.current_value.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Holding Notes (Optional)
                </label>
                <textarea
                  {...register("notes")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Portfolio target, brokerage details, account number etc."
                />
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
                  {editingInvestment ? "Save Valuation" : "Record Holding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
