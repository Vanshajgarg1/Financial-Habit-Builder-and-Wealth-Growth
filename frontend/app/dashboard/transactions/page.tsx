"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Info,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "", "income", "expense", "savings", "investment"
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected Transaction Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params: Record<string, string> = {
        skip: String(skip),
        limit: String(limit),
        sort,
      };
      if (search) params.search = search;
      if (typeFilter) params.transaction_type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.transactions.list(params) as { total: number; data: Transaction[] };
      setTransactions(res.data);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, categoryFilter, startDate, endDate, sort, page]);

  const handleDelete = async (tx: Transaction) => {
    if (!confirm(`Are you sure you want to delete this ${tx.type} record?`)) return;
    try {
      if (tx.type === "income") {
        await api.income.delete(tx.id);
      } else if (tx.type === "expense") {
        await api.expenses.delete(tx.id);
      } else if (tx.type === "investment") {
        await api.investments.delete(tx.id);
      } else {
        toast.info("Goal contributions must be deleted via their goal's history panel.");
        return;
      }
      toast.success("Transaction entry deleted successfully");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Filter & Search Ledger</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search details..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="savings">Savings Contributions</option>
            <option value="investment">Investments</option>
          </select>

          <input
            type="text"
            placeholder="Filter Category..."
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                <th className="py-4 px-6">Transaction</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                    Loading account ledger...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx, idx) => {
                  const isInc = tx.type === "income";
                  return (
                    <tr
                      key={`${tx.type}-${tx.id}-${idx}`}
                      className="hover:bg-slate-50/50 transition cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-4 px-6 font-bold text-slate-800">{tx.title}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                            tx.type === "income"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : tx.type === "expense"
                              ? "bg-rose-50 border-rose-100 text-rose-700"
                              : tx.type === "savings"
                              ? "bg-blue-50 border-blue-100 text-blue-700"
                              : "bg-indigo-50 border-indigo-100 text-indigo-700"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs uppercase font-semibold">
                        {tx.category || "General"}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{formatDate(tx.date)}</td>
                      <td className="py-4 px-6 text-right font-black">
                        <span className={isInc ? "text-emerald-600" : "text-slate-800"}>
                          {isInc ? "+" : "-"}
                          {formatCurrency(tx.amount, user?.preferred_currency)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDelete(tx)}
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
                    No transactions match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Showing page {page} of {totalPages} ({total} entries total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTx(null)} />
          <div className="relative bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-sm shadow-2xl z-10">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Transaction Details</h2>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Title / Merchant</span>
                <span className="text-slate-800 font-bold">{selectedTx.title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Type</span>
                <span className="text-slate-800 uppercase">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Category</span>
                <span className="text-slate-800 uppercase">{selectedTx.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Date</span>
                <span className="text-slate-800">{formatDate(selectedTx.date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Amount</span>
                <span className="text-slate-800 font-bold">{formatCurrency(selectedTx.amount, user?.preferred_currency)}</span>
              </div>
              {selectedTx.payment_method && (
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="text-slate-800">{selectedTx.payment_method}</span>
                </div>
              )}
              {selectedTx.is_essential !== undefined && (
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400">Necessity</span>
                  <span className="text-slate-800">{selectedTx.is_essential ? "Essential Need" : "Non-Essential Want"}</span>
                </div>
              )}
              {selectedTx.description && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Description / Notes</span>
                  <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 leading-normal">
                    {selectedTx.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
