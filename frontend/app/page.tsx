"use client";

import Link from "next/link";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar, 
  LineChart, 
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  Award
} from "lucide-react";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl text-emerald-600">
            <TrendingUp className="h-7 w-7" />
            <span>FinGrow</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-full transition duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-slate-600 hover:text-slate-950 font-medium py-2 px-4 transition"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-full transition duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Habits meet Wealth Growth</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Build Better Money Habits.<br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Grow Your Wealth.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
            Managing personal finances is not just about tracking expenses. FinGrow combines habit streaks, saving goals, investment tracking, and monthly challenges to help you achieve financial freedom.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition duration-200"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-lg py-4 px-8 rounded-xl transition"
            >
              Explore Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to master your money
            </h2>
            <p className="text-slate-600">
              A comprehensive toolkit designed specifically for students, young professionals, and beginner investors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition duration-300">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 mb-6">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Income & Expenses</h3>
              <p className="text-slate-600 leading-relaxed">
                Log recurring and one-time cash flows, classify categories, and filter history easily to stay on budget.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition duration-300">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 mb-6">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Build Savings Habits</h3>
              <p className="text-slate-600 leading-relaxed">
                Create specific savings goals, schedule contributions, track progress metrics, and auto-update your milestones.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition duration-300">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 mb-6">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Financial Challenges</h3>
              <p className="text-slate-600 leading-relaxed">
                Join exciting daily or monthly challenges like &apos;No online food orders for 5 days&apos; to build consistency.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition duration-300">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gamified Badges & Streaks</h3>
              <p className="text-slate-600 leading-relaxed">
                Maintain consistency streaks for completing habits. Earn reward points and unlock badges to showcase progress.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition duration-300">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 mb-6">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Monitor Investment Growth</h3>
              <p className="text-slate-600 leading-relaxed">
                Track stocks, mutual funds, gold, and other asset values. Real-time return percentage and P&L indicators.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition duration-300">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 mb-6">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reports & Financial Insights</h3>
              <p className="text-slate-600 leading-relaxed">
                Understand your cash flows with rule-based automated insights. View income vs expense charts and export CSVs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Follow these simple steps to transition from tracking to growing your net worth.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-12 relative">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="font-bold text-lg mb-3">Log Your Transactions</h3>
              <p className="text-sm text-slate-600">
                Keep dynamic record of daily earnings and spending. Categorize by essential or non-essential.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="font-bold text-lg mb-3">Track Daily Habits</h3>
              <p className="text-sm text-slate-600">
                Check off tasks like &apos;Avoid unnecessary shopping&apos; to build consistent behavioral streaks.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="font-bold text-lg mb-3">Watch Your Wealth Grow</h3>
              <p className="text-sm text-slate-600">
                Visualize total assets, investments, and progress towards goals on a clean, professional dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
              Why FinGrow is different from simple trackers
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-6 w-6 mt-1 text-emerald-600 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Total Ownership Check</h4>
                  <p className="text-slate-600 text-sm">
                    Only you can view or modify your data. Secure token-based encryption keeps your financial details private.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 mt-1 text-emerald-600 shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Consistency Streaks</h4>
                  <p className="text-slate-600 text-sm">
                    Instead of just reviewing numbers at the end of the month, build accountability daily.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 mt-1 text-emerald-600 shrink-0">
                  <LineChart className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Portfolio & Net Worth Tracking</h4>
                  <p className="text-slate-600 text-sm">
                    Easily calculate your Net Worth dynamically as: <code className="bg-slate-100 text-xs px-1.5 py-0.5 rounded">Savings + Current Investment Value</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-40 bg-white/10 rounded-full blur-2xl" />
            <h3 className="text-2xl font-bold mb-4">Start your journey today</h3>
            <p className="text-emerald-50 mb-8 leading-relaxed">
              Create an account or sign in with our predefined demo credentials to explore realistic mock transactions, savings goals, charts, and habits.
            </p>
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl mb-8">
              <span className="block text-sm font-medium text-emerald-100 mb-2">Demo Credentials</span>
              <div className="text-sm font-mono space-y-1">
                <div>Email: demo@fingrow.app</div>
                <div>Password: Demo@123</div>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-white hover:bg-emerald-50 text-emerald-700 font-semibold py-4 px-6 rounded-xl transition"
            >
              Sign In with Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to improve your financial habits?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-10">
            Sign up now for free. No credit card required. Start managing savings goals, tracking investments, and completing habit cards immediately.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg transition duration-200"
          >
            Create Your Account
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-900 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-white text-xl">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <span>FinGrow</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} FinGrow. All rights reserved. Built for modern financial wellness.
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/login" className="hover:text-white transition">Login</Link>
            <Link href="/signup" className="hover:text-white transition">Signup</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
