"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { SavingsGoal, GOAL_CATEGORIES } from "@/types";
import { formatCurrency, formatDate, getDaysRemaining, getProgressColor } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Target, 
  Loader2,
  X,
  Coins,
  Calendar,
  CheckCircle,
  AlertTriangle,
  History
} from "lucide-react";
import { toast } from "sonner";

const goalSchema = z.object({
  title: z.string().min(2, "Goal title must be at least 2 characters"),
  target_amount: z.coerce.number().positive("Target amount must be greater than zero"),
  category: z.string().min(1, "Please select a category"),
  target_date: z.string().optional(),
  description: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const contributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string().min(1, "Please select a date"),
  note: z.string().optional(),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

export default function GoalsPage() {
  const { user, refreshUser } = useUser();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);

  // Goal Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [submittingGoal, setSubmittingGoal] = useState(false);

  // Contribution Modal State
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [submittingContribution, setSubmittingContribution] = useState(false);

  const goalForm = useForm<GoalFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(goalSchema) as any,
  });

  const contributionForm = useForm<ContributionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contributionSchema) as any,
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await api.goals.list() as SavingsGoal[];
      setGoals((data as any[]) || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async (goalId: number) => {
    try {
      const data = await api.goals.contributions(goalId);
      setContributions((data as any[]) || []);
    } catch (err: any) {
      toast.error("Failed to load contribution history");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    goalForm.setValue("title", goal.title);
    goalForm.setValue("target_amount", goal.target_amount);
    goalForm.setValue("category", goal.category);
    goalForm.setValue("target_date", goal.target_date ? goal.target_date.split("T")[0] : "");
    goalForm.setValue("description", goal.description || "");
    setGoalModalOpen(true);
  };

  const handleAddGoalClick = () => {
    setEditingGoal(null);
    goalForm.reset({
      title: "",
      target_amount: 0,
      category: "Emergency fund",
      target_date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setGoalModalOpen(true);
  };

  const onGoalSubmit = async (data: GoalFormValues) => {
    setSubmittingGoal(true);
    try {
      if (editingGoal) {
        await api.goals.update(editingGoal.id, data);
        toast.success("Goal updated successfully");
      } else {
        await api.goals.create(data);
        toast.success("Savings Goal created! Start contributing!");
      }
      setGoalModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Goal operation failed");
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    try {
      await api.goals.delete(id);
      toast.success("Goal deleted successfully");
      if (selectedGoal?.id === id) {
        setSelectedGoal(null);
        setContributions([]);
      }
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleOpenContribute = (goal: SavingsGoal) => {
    setContributingGoal(goal);
    contributionForm.reset({
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
    setContributionModalOpen(true);
  };

  const onContributionSubmit = async (data: ContributionFormValues) => {
    if (!contributingGoal) return;
    setSubmittingContribution(true);
    try {
      await api.goals.addContribution(contributingGoal.id, data);
      toast.success("Contribution recorded! Keep it up! +5 pts");
      setContributionModalOpen(false);
      fetchGoals();
      await refreshUser(); // Update points in top bar
      if (selectedGoal?.id === contributingGoal.id) {
        fetchContributions(contributingGoal.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record contribution");
    } finally {
      setSubmittingContribution(false);
    }
  };

  const selectGoalForDetails = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    fetchContributions(goal.id);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-100 p-6 rounded-3xl shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Savings Goals</h2>
            <p className="text-xs text-slate-500">Plan and save for milestones while earning badges</p>
          </div>
        </div>
        <button
          onClick={handleAddGoalClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-emerald-600/10"
        >
          <Plus className="h-5 w-5" /> New Savings Goal
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Goals List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <p className="text-center text-slate-400 py-20 italic">Loading your savings goals...</p>
          ) : goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((g) => {
                const pct = (g.current_amount / g.target_amount) * 100;
                const days = g.target_date ? getDaysRemaining(g.target_date) : null;
                const isOverdue = g.status === "overdue";
                const isCompleted = g.status === "completed";

                return (
                  <div
                    key={g.id}
                    onClick={() => selectGoalForDetails(g)}
                    className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition relative flex flex-col justify-between ${
                      selectedGoal?.id === g.id ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {g.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                              <CheckCircle className="h-4 w-4" /> Done
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold animate-pulse">
                              <AlertTriangle className="h-4 w-4" /> Overdue
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">In Progress</span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg mb-1.5">{g.title}</h3>
                      {g.description && <p className="text-xs text-slate-500 mb-4 line-clamp-2">{g.description}</p>}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="flex justify-between items-baseline">
                        <div className="text-sm font-bold text-slate-800">
                          {formatCurrency(g.current_amount, user?.preferred_currency)}
                          <span className="text-xs font-medium text-slate-400"> of {formatCurrency(g.target_amount, user?.preferred_currency)}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-600">{pct.toFixed(0)}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {g.target_date ? formatDate(g.target_date) : "No target date"}
                        </span>
                        {days !== null && days > 0 && !isCompleted && (
                          <span>{days} days remaining</span>
                        )}
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenContribute(g)}
                          disabled={isCompleted}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Coins className="h-4 w-4" /> Contribute
                        </button>
                        <button
                          onClick={() => handleEditGoal(g)}
                          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition"
                          title="Edit"
                        >
                          <Edit3 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 rounded-xl transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 p-12 text-center rounded-3xl shadow-sm">
              <p className="text-slate-400 italic">No savings goals created yet. Start planning for your laptop, emergency fund, or travel goals!</p>
            </div>
          )}
        </div>

        {/* Right Column: Goal Detail & Contribution History */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            <History className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Contribution History</h3>
          </div>
          {selectedGoal ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block uppercase">Selected Goal</span>
                <span className="font-bold text-slate-800 text-sm block">{selectedGoal.title}</span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {contributions.length > 0 ? (
                  contributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">
                          +{formatCurrency(c.amount, user?.preferred_currency)}
                        </span>
                        {c.note && <span className="text-slate-400 block mt-0.5">{c.note}</span>}
                      </div>
                      <span className="text-slate-400">{formatDate(c.date)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">No contributions added to this goal yet.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-10">Select a goal to view its contribution history.</p>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGoalModalOpen(false)} />
          <div className="relative bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-lg shadow-2xl z-10">
            <button
              onClick={() => setGoalModalOpen(false)}
              className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingGoal ? "Edit Savings Goal" : "Create New Goal"}
            </h2>

            <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  {...goalForm.register("title")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    goalForm.formState.errors.title ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="e.g. Emergency Fund, New Laptop, etc."
                />
                {goalForm.formState.errors.title && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{goalForm.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Target Amount
                </label>
                <input
                  type="number"
                  {...goalForm.register("target_amount")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    goalForm.formState.errors.target_amount ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="0.00"
                />
                {goalForm.formState.errors.target_amount && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{goalForm.formState.errors.target_amount.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    {...goalForm.register("category")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    {...goalForm.register("target_date")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description / Notes (Optional)
                </label>
                <textarea
                  {...goalForm.register("description")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Why are you saving for this?"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGoal}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2"
                >
                  {submittingGoal && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingGoal ? "Save Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {contributionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setContributionModalOpen(false)} />
          <div className="relative bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-sm shadow-2xl z-10">
            <button
              onClick={() => setContributionModalOpen(false)}
              className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Add Contribution</h2>
            <p className="text-xs text-slate-500 mb-6">
              Goal: <strong className="text-slate-700">{contributingGoal?.title}</strong>
            </p>

            <form onSubmit={contributionForm.handleSubmit(onContributionSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  {...contributionForm.register("amount")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    contributionForm.formState.errors.amount ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="0.00"
                />
                {contributionForm.formState.errors.amount && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{contributionForm.formState.errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  {...contributionForm.register("date")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  {...contributionForm.register("note")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Transfer reference, cash, etc."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setContributionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContribution}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-xs flex items-center gap-1.5"
                >
                  {submittingContribution && <Loader2 className="h-4 w-4 animate-spin" />}
                  Record Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
