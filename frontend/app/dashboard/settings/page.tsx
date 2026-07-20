"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { CURRENCIES } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User as UserIcon, 
  Lock, 
  Trash2, 
  Loader2,
  AlertTriangle,
  Coins,
  Bell,
  Award,
  Settings
} from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  preferred_currency: z.string().min(1, "Please select preferred currency"),
  monthly_income_target: z.coerce.number().nonnegative(),
  monthly_savings_target: z.coerce.number().nonnegative(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters long"),
  confirm_password: z.string().min(8, "Confirm password must match"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, refreshUser, logout } = useUser();
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notifyInApp, setNotifyInApp] = useState(user?.notify_in_app ?? true);
  const [notifyBrowser, setNotifyBrowser] = useState(user?.notify_browser ?? false);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setNotifyInApp(user.notify_in_app);
      setNotifyBrowser(user.notify_browser);
    }
    // Load badges
    api.badges.list().then((data: any) => setBadges(data || [])).catch(() => {});
  }, [user]);

  const handleNotificationSave = async () => {
    setUpdatingNotifications(true);
    try {
      await api.auth.update({ notify_in_app: notifyInApp, notify_browser: notifyBrowser });
      toast.success("Notification preferences saved!");
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to save notification preferences");
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const profileForm = useForm<ProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      full_name: user?.full_name || "",
      preferred_currency: user?.preferred_currency || "INR",
      monthly_income_target: user?.monthly_income_target || 0,
      monthly_savings_target: user?.monthly_savings_target || 0,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(passwordSchema) as any,
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setUpdatingProfile(true);
    try {
      await api.auth.update(data);
      toast.success("Profile preferences updated successfully");
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile settings");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setUpdatingPassword(true);
    try {
      await api.auth.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.message || "Password change failed. Check your current password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmName = prompt(
      `⚠️ WARNING: Deleting your account will permanently wipe all your incomes, expenses, savings goals, investments, and habit completions. This action CANNOT be undone.\n\nTo confirm, type your full name: "${user?.full_name}"`
    );
    if (confirmName !== user?.full_name) {
      toast.error("Confirmation name did not match. Account deletion cancelled.");
      return;
    }

    setDeletingAccount(true);
    try {
      await api.auth.deleteAccount();
      toast.success("Your FinGrow account has been deleted. Goodbye!");
      logout();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Stats Banner */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-5 py-3 rounded-2xl">
          <Coins className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Total Points</p>
            <p className="text-2xl font-black text-amber-700">{user?.points ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 px-5 py-3 rounded-2xl">
          <Award className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Badges Earned</p>
            <p className="text-2xl font-black text-purple-700">{badges.length}</p>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center ml-2">
            {badges.slice(0, 8).map((ub: any) => (
              <span
                key={ub.id}
                title={ub.badge?.name}
                className="text-2xl cursor-default transition hover:scale-125"
              >
                {ub.badge?.icon || "⭐"}
              </span>
            ))}
            {badges.length > 8 && (
              <span className="text-xs text-slate-400 font-semibold">+{badges.length - 8} more</span>
            )}
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Profile Info */}
          <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <UserIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">Profile Details &amp; Target Metrics</h3>
            </div>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit as any)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...profileForm.register("full_name")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">{profileForm.formState.errors.full_name.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Preferred Currency
                  </label>
                  <select
                    {...profileForm.register("preferred_currency")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Monthly Income Target ({CURRENCIES[user?.preferred_currency || "INR"]})
                  </label>
                  <input
                    type="number"
                    {...profileForm.register("monthly_income_target")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Monthly Savings Target ({CURRENCIES[user?.preferred_currency || "INR"]})
                  </label>
                  <input
                    type="number"
                    {...profileForm.register("monthly_savings_target")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  {updatingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Notification Preferences */}
          <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <Bell className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">Notification Preferences</h3>
            </div>

            <div className="space-y-4">
              {/* In-app notifications */}
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-slate-800">In-App Notifications</p>
                  <p className="text-xs text-slate-500 mt-0.5">Show alerts and reminders inside the app</p>
                </div>
                <button
                  type="button"
                  id="toggle-notify-inapp"
                  onClick={() => setNotifyInApp(!notifyInApp)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    notifyInApp ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                  aria-checked={notifyInApp}
                  role="switch"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notifyInApp ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Browser notifications */}
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-slate-800">Browser Notifications</p>
                  <p className="text-xs text-slate-500 mt-0.5">Get push notifications in your browser</p>
                </div>
                <button
                  type="button"
                  id="toggle-notify-browser"
                  onClick={() => setNotifyBrowser(!notifyBrowser)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    notifyBrowser ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                  aria-checked={notifyBrowser}
                  role="switch"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notifyBrowser ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                id="save-notifications-btn"
                onClick={handleNotificationSave}
                disabled={updatingNotifications}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                {updatingNotifications && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Notification Settings
              </button>
            </div>
          </div>

          {/* Section 3: Password Update */}
          <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <Lock className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">Change Password</h3>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit as any)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register("current_password")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
                {passwordForm.formState.errors.current_password && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{passwordForm.formState.errors.current_password.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    {...passwordForm.register("new_password")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">{passwordForm.formState.errors.new_password.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    {...passwordForm.register("confirm_password")}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                  {passwordForm.formState.errors.confirm_password && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">{passwordForm.formState.errors.confirm_password.message as string}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  {updatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Deletion Panel */}
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-rose-50 pb-4 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold text-base">Danger Zone</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Once you delete your account, there is no going back. All database records relating to your profile will be permanently purged.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            id="delete-account-btn"
            className="w-full inline-flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3.5 px-4 rounded-xl transition text-xs"
          >
            {deletingAccount ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete FinGrow Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


