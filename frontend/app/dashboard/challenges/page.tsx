"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { Challenge, UserChallenge } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Award, 
  Loader2,
  X,
  Compass,
  PlayCircle,
  CheckCircle,
  HelpCircle,
  Coins,
  Calendar,
  Sparkles,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

const challengeSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  challenge_type: z.string().min(1, "Please select a type"),
  target_value: z.number().positive("Target must be greater than zero"),
  duration_days: z.number().positive("Duration must be at least 1 day"),
  reward_points: z.number().nonnegative("Points must be non-negative"),
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;



export default function ChallengesPage() {
  const { user, refreshUser } = useUser();
  const [predefined, setPredefined] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state for updating progress
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedUserCh, setSelectedUserCh] = useState<UserChallenge | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      challenge_type: "saving",
      target_value: 0,
      duration_days: 7,
      reward_points: 100,
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const pred = await api.challenges.list() as Challenge[];
      const userCh = await api.challenges.userChallenges() as UserChallenge[];
      setPredefined(pred);
      setMyChallenges(userCh);
    } catch (err: any) {
      toast.error(err.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoin = async (id: number) => {
    try {
      await api.challenges.join(id);
      toast.success("Joined challenge successfully! Stay focused!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to join challenge");
    }
  };

  const handleLeave = async (id: number) => {
    if (!confirm("Are you sure you want to abandon this challenge? Your progress will be lost.")) return;
    try {
      await api.challenges.leave(id);
      toast.success("Abandoned challenge");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const openProgressDialog = (uc: UserChallenge) => {
    setSelectedUserCh(uc);
    setProgressValue(uc.current_progress);
    setProgressDialogOpen(true);
  };

  const handleUpdateProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserCh) return;
    setUpdatingProgress(true);
    try {
      const res = await api.challenges.updateProgress(selectedUserCh.id, progressValue) as any;
      if (res.status === "completed") {
        toast.success(`🎉 Congratulations! Challenge Completed! Unlocked Badge and earned +${selectedUserCh.challenge.reward_points} points!`);
        await refreshUser();
      } else {
        toast.success("Progress updated successfully!");
      }
      setProgressDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update progress");
    } finally {
      setUpdatingProgress(false);
    }
  };

  const onSubmitCustomChallenge = async (data: ChallengeFormValues) => {
    setSubmitting(true);
    try {
      // 1. Create Challenge
      const created = await api.challenges.create(data) as Challenge;
      toast.success("Custom challenge created!");
      // 2. Auto-join custom challenge
      await api.challenges.join(created.id);
      setModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom challenge");
    } finally {
      setSubmitting(false);
    }
  };

  const activeUserChallenges = myChallenges.filter((uc) => uc.status === "active");
  const completedUserChallenges = myChallenges.filter((uc) => uc.status === "completed");

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-100 p-6 rounded-3xl shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Financial Challenges</h2>
            <p className="text-xs text-slate-500">Participate in challenges to test your limits and win rewards</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-emerald-600/10"
        >
          <Plus className="h-5 w-5" /> Start Custom Challenge
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrolled Challenges */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Challenges */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Active Enrolled Challenges ({activeUserChallenges.length})</h3>
            {activeUserChallenges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeUserChallenges.map((uc) => (
                  <div
                    key={uc.id}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                          {uc.challenge.challenge_type}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
                          {uc.days_remaining} Days Left
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mb-1.5">{uc.challenge.title}</h4>
                      {uc.challenge.description && (
                        <p className="text-xs text-slate-500 mb-4">{uc.challenge.description}</p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="flex justify-between items-baseline text-xs font-bold">
                        <span className="text-slate-600">
                          Progress: {uc.current_progress} / {uc.challenge.target_value}
                        </span>
                        <span className="text-emerald-600">{uc.progress_percentage.toFixed(0)}%</span>
                      </div>

                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, uc.progress_percentage)}%` }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openProgressDialog(uc)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition"
                        >
                          Update Progress
                        </button>
                        <button
                          onClick={() => handleLeave(uc.id)}
                          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 rounded-xl transition text-xs font-bold"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-white border border-slate-100 p-8 text-center rounded-3xl shadow-sm">
                You haven&apos;t joined any active challenges. Join one of our predefined options below!
              </p>
            )}
          </div>

          {/* Completed Challenges */}
          {completedUserChallenges.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Completed Milestones ({completedUserChallenges.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedUserChallenges.map((uc) => (
                  <div
                    key={uc.id}
                    className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                          Completed
                        </span>
                        <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 animate-bounce" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mb-1">{uc.challenge.title}</h4>
                      <p className="text-xs text-slate-500">Reward: +{uc.challenge.reward_points} pts claimed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Predefined Discovery Library */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
            <Compass className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Challenge Discovery</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {predefined.map((ch) => {
              const joined = myChallenges.some((uc) => uc.challenge_id === ch.id && uc.status === "active");
              return (
                <div key={ch.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                      <span className="uppercase tracking-wider">{ch.challenge_type}</span>
                      <span className="text-amber-600">+{ch.reward_points} pts</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{ch.title}</h4>
                    {ch.description && <p className="text-[11px] text-slate-500 mt-1 leading-normal">{ch.description}</p>}
                  </div>
                  <button
                    disabled={joined}
                    onClick={() => handleJoin(ch.id)}
                    className={`w-full font-bold text-xs py-2 px-3 rounded-xl transition ${
                      joined
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {joined ? "Joined" : "Join Challenge"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Challenge Modal */}
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
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create Custom Challenge</h2>

            <form onSubmit={handleSubmit(onSubmitCustomChallenge)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Challenge Title
                </label>
                <input
                  type="text"
                  {...register("title")}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.title ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="e.g. Save ₹2000 this week, Limit dining out to 2 days"
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Challenge Type
                  </label>
                  <select
                    {...register("challenge_type")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="saving">Saving</option>
                    <option value="spending_control">Spending Control</option>
                    <option value="expense_recording">Expense Recording</option>
                    <option value="investing">Investing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    {...register("duration_days", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Target Value (e.g. Total Amount / Day count)
                  </label>
                  <input
                    type="number"
                    {...register("target_value", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 2000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    {...register("reward_points", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Detail the rules of this challenge..."
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
                  Create & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Dialog */}
      {progressDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setProgressDialogOpen(false)} />
          <div className="relative bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-sm shadow-2xl z-10">
            <button
              onClick={() => setProgressDialogOpen(false)}
              className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Update Progress</h2>
            <p className="text-xs text-slate-500 mb-6">
              Goal Target: <strong className="text-slate-700">{selectedUserCh?.challenge.target_value}</strong>
            </p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Current Progress Value
                </label>
                <input
                  type="number"
                  step="any"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProgressDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProgress}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-xs flex items-center gap-1.5"
                >
                  {updatingProgress && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
