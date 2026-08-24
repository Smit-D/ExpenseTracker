export interface Category {
  id: string;
  name: string;
  target_amount?: number;
  created_at?: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  expense_date: string;
  description?: string;
  created_at?: string;
  updated_datetime?: string;
  categories?: Category; // Supabase joined relation
}
