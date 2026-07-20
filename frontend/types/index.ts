export interface User {
  id: number;
  full_name: string;
  email: string;
  preferred_currency: string;
  monthly_income_target: number;
  monthly_savings_target: number;
  points: number;
  notify_in_app: boolean;
  notify_browser: boolean;
  theme: string;
  created_at: string;
}

export interface Income {
  id: number;
  user_id: number;
  amount: number;
  source: string;
  category: string;
  date: string;
  description?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  title: string;
  category: string;
  payment_method: string;
  date: string;
  description?: string;
  is_recurring: boolean;
  is_essential: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  description?: string;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  created_at: string;
}

export interface SavingsContribution {
  id: number;
  user_id: number;
  goal_id: number;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

export interface Investment {
  id: number;
  user_id: number;
  name: string;
  investment_type: string;
  amount_invested: number;
  current_value: number;
  purchase_date: string;
  notes?: string;
  profit_loss: number;
  return_percentage: number;
  created_at: string;
}

export interface Habit {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  habit_type: string;
  target_amount?: number;
  frequency: "daily" | "weekly" | "monthly";
  start_date: string;
  reminder_time?: string;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completed_today: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  completion_date: string;
  period_key: string;
  created_at: string;
}

export interface Challenge {
  id: number;
  title: string;
  description?: string;
  challenge_type: string;
  target_value: number;
  duration_days: number;
  reward_points: number;
  is_predefined: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: number;
  user_id: number;
  challenge_id: number;
  challenge: Challenge;
  start_date: string;
  end_date: string;
  current_progress: number;
  status: "active" | "completed" | "abandoned";
  progress_percentage: number;
  days_remaining: number;
  completed_at?: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  reminder_type: string;
  reminder_date?: string;
  reminder_time?: string;
  frequency: string;
  related_entity_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
  icon: string;
  points_required: number;
  trigger: string;
}

export interface UserBadge {
  id: number;
  badge: Badge;
  awarded_at: string;
}

export interface Transaction {
  id: number;
  type: "income" | "expense" | "savings" | "investment";
  amount: number;
  title: string;
  category: string;
  date: string;
  description?: string;
  is_recurring?: boolean;
  payment_method?: string;
  is_essential?: boolean;
}

export interface DashboardSummary {
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  total_invested: number;
  current_portfolio_value: number;
  net_worth: number;
  balance: number;
  savings_rate: number;
  best_streak: number;
  points: number;
  active_goals: Array<{
    id: number;
    title: string;
    target_amount: number;
    current_amount: number;
    progress: number;
  }>;
  today_habits_count: number;
  active_challenge?: {
    id: number;
    challenge_id: number;
    status: string;
    current_progress: number;
  };
  recent_transactions: Transaction[];
}

export interface Insight {
  type: string;
  icon: string;
  text: string;
  sentiment: "positive" | "neutral" | "warning";
}

export const INCOME_CATEGORIES = [
  "Salary", "Freelancing", "Business", "Scholarship", "Gift", "Investment return", "Other"
];

export const EXPENSE_CATEGORIES = [
  "Food", "Rent", "Transportation", "Shopping", "Entertainment",
  "Education", "Healthcare", "Utilities", "Subscriptions", "Travel", "Other"
];

export const PAYMENT_METHODS = [
  "Cash", "UPI", "Debit Card", "Credit Card", "Bank Transfer", "Other"
];

export const GOAL_CATEGORIES = [
  "Emergency fund", "Laptop", "Education", "Travel", "Vehicle", "Home", "Wedding", "Other"
];

export const INVESTMENT_TYPES = [
  "Stocks", "Mutual funds", "Fixed deposit", "Recurring deposit",
  "Cryptocurrency", "Gold", "Provident fund", "Other"
];

export const HABIT_TYPES = [
  "saving", "spending_control", "expense_recording", "investing", "financial_review", "custom"
];

export const CURRENCIES: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};
