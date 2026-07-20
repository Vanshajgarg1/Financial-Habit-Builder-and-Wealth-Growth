"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { formatCurrency, formatPercent, getSentimentColor } from "@/lib/utils";
import { 
  BarChart3, 
  Download, 
  Printer, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Target, 
  Wallet,
  Sparkles,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  LineChart,
  Line,
  Legend
} from "recharts";

export default function ReportsPage() {
  const { user } = useUser();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthsList = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        month: String(selectedMonth),
        year: String(selectedYear),
      };
      const data = await api.reports.get(params);
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load report analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handleExportCSV = () => {
    try {
      const url = api.reports.exportUrl(selectedMonth, selectedYear);
      window.open(url, "_blank");
      toast.success("CSV file export started");
    } catch (err) {
      toast.error("Failed to export report CSV");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
        </div>
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const { summary, previous_month, investment_summary, habit_completion_rate, monthly_trend } = report;

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  return (
    <div className="space-y-8 print:p-0 print:space-y-4">
      {/* Controls / Filter Panel (Hidden during Print) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-white border border-slate-100 p-6 rounded-3xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10"
          >
            <Printer className="h-4 w-4" /> Save as PDF / Print
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center space-y-1 mb-8">
        <h1 className="text-3xl font-black text-slate-900">FinGrow Monthly Statement</h1>
        <p className="text-sm font-semibold text-slate-500">
          Statement for: {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Income
          </span>
          <span className="block text-2xl font-black text-slate-900">
            {formatCurrency(summary.total_income, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Prev month: {formatCurrency(previous_month.total_income, user?.preferred_currency)}
          </span>
        </div>

        {/* Expense */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Expenses
          </span>
          <span className="block text-2xl font-black text-slate-900">
            {formatCurrency(summary.total_expenses, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Prev month: {formatCurrency(previous_month.total_expenses, user?.preferred_currency)}
          </span>
        </div>

        {/* Savings */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Savings
          </span>
          <span className="block text-2xl font-black text-slate-900">
            {formatCurrency(summary.total_savings, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Savings rate: {summary.savings_rate}%
          </span>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Net Cash Flow
          </span>
          <span className={`block text-2xl font-black ${summary.net_cash_flow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(summary.net_cash_flow, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Net savings after expenses
          </span>
        </div>
      </div>

      {/* Grid: Charts & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trend (last 6 months) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Cash Flow & Savings Trend (Last 6 Months)</h3>
          <div className="h-80 w-full">
            {monthly_trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), user?.preferred_currency)} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="total_income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="total_expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="total_savings" name="Savings" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 italic text-center py-20">Loading trends...</p>
            )}
          </div>
        </div>

        {/* Expense Category Allocations Pie */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Expense Categories Breakdown</h3>
          <div className="h-80 w-full flex flex-col justify-center">
            {summary.expense_by_category && summary.expense_by_category.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.expense_by_category}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {summary.expense_by_category.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), user?.preferred_currency)} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend list */}
                <div className="flex flex-wrap gap-2 justify-center text-[10px] font-semibold text-slate-600 mt-2 max-h-12 overflow-y-auto pr-1">
                  {summary.expense_by_category.map((entry: any, index: number) => (
                    <span key={entry.category} className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.category}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-20">No expense records found for this period.</p>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown grids: Essential vs Non-essential and Habit Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Necessity Allocation */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Essential vs Non-Essential Spending</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-600">Needs (Essential / Bills)</span>
              <span className="text-slate-800 font-bold">
                {formatCurrency(summary.essential_spending, user?.preferred_currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-600">Wants (Non-Essential / Leisure)</span>
              <span className="text-slate-800 font-bold">
                {formatCurrency(summary.non_essential_spending, user?.preferred_currency)}
              </span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-amber-500 h-3.5 rounded-full overflow-hidden flex">
                {summary.essential_spending + summary.non_essential_spending > 0 ? (
                  <>
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${
                          (summary.essential_spending /
                            (summary.essential_spending + summary.non_essential_spending)) *
                          100
                        }%`,
                      }}
                      title="Needs"
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{
                        width: `${
                          (summary.non_essential_spending /
                            (summary.essential_spending + summary.non_essential_spending)) *
                          100
                        }%`,
                      }}
                      title="Wants"
                    />
                  </>
                ) : (
                  <div className="bg-slate-200 w-full h-full" />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-bold mt-2">
                <span className="text-emerald-600">Needs (Green)</span>
                <span className="text-amber-600">Wants (Amber)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Habit Completion analytics */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Habit Consistency rate</h3>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black text-emerald-600">{habit_completion_rate}%</span>
            <div>
              <span className="text-xs font-bold text-slate-700 block">Behavior Completion Rate</span>
              <span className="text-[10px] text-slate-500 leading-normal block">
                Calculated based on active habits completed within this statement month.
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Valuation */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-4">Investment Performance</h3>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500">Invested Capital:</span>
                <span className="text-slate-800 font-bold">
                  {formatCurrency(investment_summary.total_invested, user?.preferred_currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Market Value:</span>
                <span className="text-slate-800 font-bold">
                  {formatCurrency(investment_summary.current_value, user?.preferred_currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-2 font-bold">
                <span className="text-slate-600">Net Profit/Loss:</span>
                <span className={investment_summary.profit_loss >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {investment_summary.profit_loss >= 0 ? "+" : ""}
                  {formatCurrency(investment_summary.profit_loss, user?.preferred_currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
