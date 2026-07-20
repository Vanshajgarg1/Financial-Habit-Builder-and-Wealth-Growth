"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import api from "@/lib/api";
import { toast } from "sonner";

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirm_password: z.string().min(8, "Confirm password must match"),
    terms: z.literal(true, {
      error: () => "You must accept the terms & conditions",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setSubmitting(true);
    try {
      // 1. Register User
      await api.auth.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
      });

      toast.success("Account created! Logging in...");

      // 2. Automatically Log User In
      const tokenRes = await api.auth.login({
        email: data.email,
        password: data.password,
      });

      await login(tokenRes.access_token);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Email might be in use.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 p-8 md:p-10 shadow-xl shadow-slate-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center gap-2 font-bold text-3xl text-emerald-600 mb-2">
            <TrendingUp className="h-8 w-8" />
            <span>FinGrow</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
          <p className="text-sm text-slate-500 mt-1">
            Start building positive money habits today.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              {...register("full_name")}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.full_name ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-emerald-100"
              } focus:outline-none focus:ring-4 focus:border-emerald-500 transition`}
              placeholder="Arjun Sharma"
            />
            {errors.full_name && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.email ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-emerald-100"
              } focus:outline-none focus:ring-4 focus:border-emerald-500 transition`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`w-full pl-4 pr-12 py-2.5 rounded-xl border ${
                  errors.password ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-emerald-100"
                } focus:outline-none focus:ring-4 focus:border-emerald-500 transition`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("confirm_password")}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.confirm_password ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-emerald-100"
              } focus:outline-none focus:ring-4 focus:border-emerald-500 transition`}
              placeholder="••••••••"
            />
            {errors.confirm_password && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("terms")}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
              />
              <span className="text-sm text-slate-600 leading-snug">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => toast.info("Privacy & Terms: Only educational tracking. No real money operations.")}
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Terms & Conditions
                </button>{" "}
                and Privacy Policy.
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-rose-500 font-medium">{errors.terms.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
