"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { 
  TrendingUp, 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Target, 
  LineChart, 
  CalendarCheck, 
  Award, 
  Bell, 
  History, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Coins
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Income", href: "/dashboard/income", icon: ArrowUpRight },
    { name: "Expenses", href: "/dashboard/expenses", icon: ArrowDownLeft },
    { name: "Savings Goals", href: "/dashboard/goals", icon: Target },
    { name: "Investments", href: "/dashboard/investments", icon: LineChart },
    { name: "Habits", href: "/dashboard/habits", icon: CalendarCheck },
    { name: "Challenges", href: "/dashboard/challenges", icon: Award },
    { name: "Reminders", href: "/dashboard/reminders", icon: Bell },
    { name: "Transactions", href: "/dashboard/transactions", icon: History },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Profile & Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-2 text-white font-bold text-2xl">
          <TrendingUp className="h-7 w-7 text-emerald-500" />
          <span>FinGrow</span>
        </div>

        {/* User Card */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shadow-lg shadow-emerald-500/25">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <span className="block text-white font-bold truncate text-sm">{user.full_name}</span>
            <span className="block text-xs text-slate-400 truncate">{user.email}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "hover:bg-slate-800/60 hover:text-white text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 transition"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 text-white px-5 py-4 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl">
          <TrendingUp className="h-6 w-6 text-emerald-500" />
          <span>FinGrow</span>
        </div>
        <button onClick={toggleMobileMenu} className="p-1 hover:bg-slate-800 rounded transition">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay / Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu} />
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-900 text-slate-300 h-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 font-bold text-xl text-white">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
                <span>FinGrow</span>
              </div>
              <button onClick={toggleMobileMenu} className="p-1 hover:bg-slate-800 rounded transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
              <div className="h-10 w-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <span className="block text-white font-bold truncate text-sm">{user.full_name}</span>
                <span className="block text-xs text-slate-400 truncate">{user.email}</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={toggleMobileMenu}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md"
                        : "hover:bg-slate-800 hover:text-white text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-800 mt-auto">
              <button
                onClick={() => {
                  toggleMobileMenu();
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 transition"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Stats Banner */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-800">
            {navigation.find((n) => n.href === pathname)?.name || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            {/* Gamification Points Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold text-sm">
              <Coins className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>{user.points || 0} pts</span>
            </div>
            {/* Preferred Currency Pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full font-semibold text-xs uppercase">
              Currency: {user.preferred_currency || "INR"}
            </span>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
