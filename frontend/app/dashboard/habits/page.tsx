"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Habit, HABIT_TYPES } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, Plus, X, Search, Filter, Loader2, CheckCircle2, Circle, Clock, Flame, Calendar as CalendarIcon, Edit2, Undo2, CalendarCheck, Trash2, Edit3, HelpCircle, Play, Pause, CheckCircle, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const habitSchema = z.object({
  title: z.string().min(2, "Habit title must be at least 2 characters"),
  habit_type: z.string().min(1, "Please select a habit type"),
  target_amount: z.coerce.number().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  start_date: z.string().min(1, "Please select a start date"),
  reminder_time: z.string().optional(),
  description: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

export default function HabitsPage() {
  const { user, refreshUser } = useUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [habitHistory, setHabitHistory] = useState<Record<number, any[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<HabitFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(habitSchema) as any,
  });

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const data = await api.habits.list() as Habit[];
      setHabits((data as any[]) || []);
      // Fetch history for each habit
      const historyMap: Record<number, any[]> = {};
      for (const h of data) {
        const hist = await api.habits.history(h.id);
        historyMap[h.id] = hist as any[];
      }
      setHabitHistory(historyMap);
    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleEdit = (h: Habit) => {
    setEditingHabit(h);
    setValue("title", h.title);
    setValue("habit_type", h.habit_type);
    setValue("target_amount", h.target_amount || 0);
    setValue("frequency", h.frequency);
    setValue("start_date", h.start_date.split("T")[0]);
    setValue("reminder_time", h.reminder_time || "");
    setValue("description", h.description || "");
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingHabit(null);
    reset({
      title: "",
      habit_type: "saving",
      target_amount: 0,
      frequency: "daily",
      start_date: new Date().toISOString().split("T")[0],
      reminder_time: "09:00",
      description: "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: HabitFormValues) => {
    setSubmitting(true);
    try {
      if (editingHabit) {
        await api.habits.update(editingHabit.id, data);
        toast.success("Financial habit updated");
      } else {
        await api.habits.create(data);
        toast.success("Habit created successfully! Maintain streaks to earn points.");
      }
      setModalOpen(false);
      fetchHabits();
    } catch (err: any) {
      toast.error(err.message || "Failed to save habit card");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;
    try {
      await api.habits.delete(id);
      toast.success("Habit deleted");
      fetchHabits();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const toggleComplete = async (habit: Habit) => {
    try {
      if (habit.completed_today) {
        await api.habits.undoComplete(habit.id);
        toast.success("Habit progress undone");
      } else {
        await api.habits.complete(habit.id);
        toast.success("Excellent habit checkoff! +5 pts");
        await refreshUser(); // Update total points
      }
      fetchHabits();
    } catch (err: any) {
      toast.error(err.message || "Complete operation failed");
    }
  };

  const toggleActiveStatus = async (habit: Habit) => {
    try {
      await api.habits.update(habit.id, { is_active: !habit.is_active });
      toast.success(habit.is_active ? "Habit paused" : "Habit resumed");
      fetchHabits();
    } catch (err: any) {
      toast.error(err.message || "Active toggle failed");
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-100 p-6 rounded-3xl shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Financial Habit Builder</h2>
            <p className="text-xs text-slate-500">Form productive routines, increase streaks and unlock badges</p>
          </div>
        </div>
        <button
          onClick={handleAddClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-emerald-600/10"
        >
          <Plus className="h-5 w-5" /> Add New Habit
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Habit Card Lists */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <p className="text-center text-slate-400 py-20 italic">Loading your habit trackers...</p>
          ) : habits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habits.map((h) => {
                const completions = habitHistory[h.id] || [];
                return (
                  <div
                    key={h.id}
                    className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition ${
                      h.is_active ? "border-slate-100" : "border-slate-100 opacity-60 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {h.habit_type}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600">
                          <Flame className="h-4.5 w-4.5 fill-amber-500 stroke-amber-600" />
                          <span>{h.current_streak} streak</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg mb-1">{h.title}</h3>
                      {h.description && <p className="text-xs text-slate-500 mb-4">{h.description}</p>}

                      {h.target_amount ? (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-xs font-semibold text-slate-700">
                          Target Amount: {formatCurrency(h.target_amount, user?.preferred_currency)}
                        </div>
                      ) : null}

                      {/* Micro completions indicators (last 5 completions as little check boxes) */}
                      <div className="mb-4">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Recent History ({completions.length} total)
                        </span>
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4].map((i) => {
                            const completed = completions.length > i;
                            return (
                              <div
                                key={i}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                  completed 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "border-slate-200 text-slate-300"
                                }`}
                              >
                                {completed ? "✓" : ""}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                      <button
                        onClick={() => toggleComplete(h)}
                        disabled={!h.is_active}
                        className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 ${
                          h.completed_today
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {h.completed_today ? "Undo Checkoff" : "Mark Complete"}
                      </button>

                      <button
                        onClick={() => toggleActiveStatus(h)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition"
                        title={h.is_active ? "Pause Habit" : "Resume Habit"}
                      >
                        {h.is_active ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 text-emerald-600" />}
                      </button>

                      <button
                        onClick={() => handleEdit(h)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition"
                        title="Edit"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(h.id)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 rounded-xl transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 p-12 text-center rounded-3xl shadow-sm">
              <p className="text-slate-400 italic">No habit cards active. Try adding routine habits to build savings and control spending.</p>
            </div>
          )}
        </div>

        {/* Right Column: Streaks Info */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-base">Longest Streaks</h3>
          </div>

          <div className="space-y-4">
            {habits.map((h) => (
              <div key={h.id} className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{h.title}</span>
                <div className="flex gap-3 text-slate-500 font-medium">
                  <span>Current: <strong>{h.current_streak}d</strong></span>
                  <span>Longest: <strong>{h.longest_streak}d</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Habit Modal */}
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
              {editingHabit ? "Edit Habit Card" : "New Financial Habit"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Habit Title
                </label>
                <input
                  type="text"
                  {...register("title")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.title ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="Record every expense, Save ₹100 daily, Review finances"
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Habit Type
                  </label>
                  <select
                    {...register("habit_type")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {HABIT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Frequency
                  </label>
                  <select
                    {...register("frequency")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Target Amount (Optional)
                  </label>
                  <input
                    type="number"
                    {...register("target_amount")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register("start_date")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  {...register("reminder_time")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Notes to keep you motivated..."
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
                  {editingHabit ? "Save Changes" : "Create Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
