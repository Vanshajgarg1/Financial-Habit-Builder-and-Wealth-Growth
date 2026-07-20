"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { DashboardSummary, Insight } from "@/types";
import { formatCurrency, formatPercent, getSentimentColor } from "@/lib/utils";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Target, 
  Briefcase, 
  Wallet,
  CalendarCheck,
  Award,
  Plus,
  RefreshCw,
  TrendingDown,
  Info
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
  Legend 
} from "recharts";

// Helper components for modals/forms can be integrated simply or trigger standard alerts for demo
export default function DashboardPage() {
  const { user } = useUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const sum = await api.dashboard.summary(selectedMonth, selectedYear) as DashboardSummary;
      const ch = await api.dashboard.charts(selectedYear);
      const ins = await api.dashboard.insights() as { insights: Insight[] };
      setSummary(sum);
      setCharts(ch);
      setInsights(ins.insights);
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  if (loading || !summary) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Header Skeletons */}
        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4" />
        {/* Card Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-3xl" />
          <div className="h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-8">
      {/* Month/Year Filters & Quick Actions */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
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
          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            title="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/income?action=add"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10"
          >
            <Plus className="h-4 w-4" /> Add Income
          </Link>
          <Link
            href="/dashboard/expenses?action=add"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/10"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </Link>
          <Link
            href="/dashboard/goals?action=add"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/10"
          >
            <Plus className="h-4 w-4" /> Contribute
          </Link>
          <Link
            href="/dashboard/investments?action=add"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10"
          >
            <Plus className="h-4 w-4" /> Invest
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-6 rounded-3xl text-white shadow-xl shadow-emerald-600/10">
          <span className="block text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
            Net Worth
          </span>
          <span className="block text-2xl font-black mb-2 truncate">
            {formatCurrency(summary.net_worth, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-emerald-100/90 font-medium block">
            Savings + Investments current value
          </span>
        </div>

        {/* Current Balance */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Net Cash Flow
            </span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <span className={`block text-xl font-bold truncate mb-1 ${summary.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(summary.balance, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">
            Income minus Expenses
          </span>
        </div>

        {/* Income */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total Income
            </span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <span className="block text-xl font-bold text-slate-900 truncate mb-1">
            {formatCurrency(summary.total_income, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">
            This month&apos;s earnings
          </span>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <span className="block text-xl font-bold text-slate-900 truncate mb-1">
            {formatCurrency(summary.total_expenses, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">
            This month&apos;s spending
          </span>
        </div>

        {/* Savings */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total Savings
            </span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <span className="block text-xl font-bold text-slate-900 truncate mb-1">
            {formatCurrency(summary.total_savings, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">
            Current target goal sizes
          </span>
        </div>

        {/* Investments */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Investments
            </span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <span className="block text-xl font-bold text-slate-900 truncate mb-1">
            {formatCurrency(summary.current_portfolio_value, user?.preferred_currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">
            Current portfolio valuation
          </span>
        </div>
      </div>

      {/* Gamification Streak Banner & Active Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak / Habits Progress Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Daily Streak & Habits</h3>
              <span className="text-2xl">🔥</span>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 mb-6">
              <span className="text-4xl font-extrabold text-emerald-600">
                {summary.best_streak}
              </span>
              <div>
                <span className="font-bold text-sm block">Day Streak Active</span>
                <span className="text-xs text-slate-500 block">Complete habits on time to increase.</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/habits"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3 rounded-xl transition text-sm"
          >
            <CalendarCheck className="h-4 w-4" />
            Check Today&apos;s Habits ({summary.today_habits_count} tasks)
          </Link>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-4">Monthly Savings Rate</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-black mb-2 ${summary.savings_rate >= 20 ? "text-emerald-600" : summary.savings_rate > 0 ? "text-blue-600" : "text-rose-500"}`}>
                {formatPercent(summary.savings_rate)}
              </span>
              <p className="text-xs text-slate-500 font-medium">
                {summary.savings_rate >= 20 
                  ? "Great job! Saving more than 20% is excellent." 
                  : summary.savings_rate > 0 
                  ? "Good start. Try to reach at least 20% savings."
                  : "Watch out, you are spending more than you earn."}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/reports"
            className="w-full inline-flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition text-sm"
          >
            Analyze Spending Reports
          </Link>
        </div>

        {/* Savings Goal Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-4">Active Savings Goals</h3>
            <div className="space-y-4">
              {summary.active_goals.length > 0 ? (
                summary.active_goals.map((g) => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{g.title}</span>
                      <span className="text-slate-500">
                        {formatCurrency(g.current_amount, user?.preferred_currency)} / {formatCurrency(g.target_amount, user?.preferred_currency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, g.progress)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No active savings goals found.</p>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/goals"
            className="w-full inline-flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3 rounded-xl transition text-sm mt-4"
          >
            Manage Goals
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Monthly Income vs Expenses ({selectedYear})</h3>
          <div className="h-80 w-full">
            {charts?.monthly_trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), user?.preferred_currency)} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">Loading chart data...</div>
            )}
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Expense Category Allocation</h3>
          <div className="h-80 w-full flex flex-col justify-center">
            {charts?.expense_by_category && charts.expense_by_category.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.expense_by_category}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {charts.expense_by_category.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), user?.preferred_currency)} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-2 justify-center text-[10px] font-semibold text-slate-600 mt-2 max-h-12 overflow-y-auto">
                  {charts.expense_by_category.map((entry: any, index: number) => (
                    <span key={entry.category} className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.category}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 italic">
                <span>No expense data logged for this month.</span>
                <Link href="/dashboard/expenses" className="text-xs font-bold text-emerald-600 mt-2 block hover:underline">
                  Log Expense +
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Insights & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights list */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-4">Financial Insights</h3>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {insights.length > 0 ? (
                insights.map((ins, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-2xl flex gap-3 text-xs leading-relaxed font-semibold transition ${getSentimentColor(
                      ins.sentiment
                    )}`}
                  >
                    <span className="text-lg">{ins.icon}</span>
                    <p className="mt-0.5">{ins.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Keep logging transactions to generate personalized rule-based cash flow insights.
                </p>
              )}
            </div>
          </div>
          {/* Advice Disclaimer */}
          <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-2xl flex gap-2.5 mt-6 text-[10px] font-semibold text-slate-500">
            <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer:</strong> FinGrow provides educational tracking and general insights only. It does not provide professional financial or investment advice.
            </p>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Recent Activity</h3>
            <Link href="/dashboard/transactions" className="text-xs font-bold text-emerald-600 hover:underline">
              View All Transactions
            </Link>
          </div>
          <div className="space-y-3">
            {summary.recent_transactions.length > 0 ? (
              summary.recent_transactions.map((tx, idx) => (
                <div
                  key={`${tx.type}-${tx.id}-${idx}`}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-white ${
                        tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    >
                      {tx.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{tx.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{tx.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-black block ${
                        tx.type === "income" ? "text-emerald-600" : "text-slate-800"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, user?.preferred_currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">{tx.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-10">No recent transactions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
