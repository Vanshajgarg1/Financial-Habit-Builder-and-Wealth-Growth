"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Reminder } from "@/types";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Bell, 
  Loader2,
  X,
  Calendar,
  Clock,
  CheckCircle,
  HelpCircle,
  BellRing,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const reminderSchema = z.object({
  title: z.string().min(2, "Reminder title must be at least 2 characters"),
  reminder_type: z.string().min(1, "Please select a reminder type"),
  reminder_date: z.string().optional(),
  reminder_time: z.string().min(1, "Please select a time"),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]),
  is_active: z.boolean().default(true),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

export default function RemindersPage() {
  const { user } = useUser();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReminderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reminderSchema) as any,
  });

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await api.reminders.list() as Reminder[];
      setReminders(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleEdit = (rem: Reminder) => {
    setEditingReminder(rem);
    setValue("title", rem.title);
    setValue("reminder_type", rem.reminder_type);
    setValue("reminder_date", rem.reminder_date ? rem.reminder_date.split("T")[0] : "");
    setValue("reminder_time", rem.reminder_time || "09:00");
    setValue("frequency", rem.frequency as any);
    setValue("is_active", rem.is_active);
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingReminder(null);
    reset({
      title: "",
      reminder_type: "Recording expenses",
      reminder_date: new Date().toISOString().split("T")[0],
      reminder_time: "09:00",
      frequency: "once",
      is_active: true,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ReminderFormValues) => {
    setSubmitting(true);
    try {
      if (editingReminder) {
        await api.reminders.update(editingReminder.id, data);
        toast.success("Reminder updated successfully");
      } else {
        await api.reminders.create(data);
        toast.success("In-app reminder scheduled!");
      }
      setModalOpen(false);
      fetchReminders();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await api.reminders.delete(id);
      toast.success("Reminder deleted");
      fetchReminders();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const triggerPermissionRequest = () => {
    if (!("Notification" in window)) {
      toast.error("Browser push notifications are not supported in this browser.");
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        toast.success("Browser notification permission granted! Alerts will show when due.");
      } else {
        toast.error("Notification permission denied.");
      }
    });
  };

  const reminderTypes = [
    "Recording expenses",
    "Saving money",
    "Paying bills",
    "Completing habits",
    "Reviewing finances",
    "Investment contribution",
    "Goal contribution",
  ];

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-100 p-6 rounded-3xl shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Alerts & Reminders</h2>
            <p className="text-xs text-slate-500">Configure custom alerts to keep you financially consistent</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={triggerPermissionRequest}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-2xl transition"
          >
            Enable Browser Alerts
          </button>
          <button
            onClick={handleAddClick}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-emerald-600/10"
          >
            <Plus className="h-5 w-5" /> Add Reminder
          </button>
        </div>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                <th className="py-4 px-6">Reminder Title</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Time</th>
                <th className="py-4 px-6">Frequency</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                    Loading your scheduled alerts...
                  </td>
                </tr>
              ) : reminders.length > 0 ? (
                reminders.map((rem) => (
                  <tr key={rem.id} className={`hover:bg-slate-50/50 transition ${!rem.is_active ? "opacity-50" : ""}`}>
                    <td className="py-4 px-6 font-bold text-slate-800">{rem.title}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                        {rem.reminder_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {rem.reminder_date ? formatDate(rem.reminder_date) : "N/A"}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{rem.reminder_time || "09:00"}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                        {rem.frequency}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          rem.is_active ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {rem.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(rem)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rem.id)}
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
                  <td colSpan={7} className="py-20 text-center text-slate-400 italic">
                    No reminders active. Click &quot;Add Reminder&quot; to schedule in-app notifications.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Alert Box */}
      <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-2xl flex gap-3 text-xs leading-relaxed font-semibold text-slate-500 max-w-xl">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-slate-800 mb-0.5">In-App Alerts</h4>
          <p>
            FinGrow triggers visual toast and sound alerts directly inside the application when a savings task or habit is due.
          </p>
        </div>
      </div>

      {/* Reminder modal */}
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
              {editingReminder ? "Edit Reminder" : "Add Alert Reminder"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reminder Title
                </label>
                <input
                  type="text"
                  {...register("title")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.title ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="e.g. Save ₹100, Pay Broadband Bill, Update SIP"
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Reminder Type
                  </label>
                  <select
                    {...register("reminder_type")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {reminderTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
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
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register("reminder_date")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    {...register("reminder_time")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-55 h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-slate-600 cursor-pointer">
                  Is reminder enabled?
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
                  Schedule Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
