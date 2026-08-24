import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environment';
import { Category, Expense } from '../models/expense.model';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  private refreshTrigger = new Subject<void>();
  refresh$ = this.refreshTrigger.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  notifyDataChanged() {
    this.refreshTrigger.next();
  }

  // --- Category APIs ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  }

  async addCategory(category: Partial<Category>) {
    const { data, error } = await this.supabase.from('categories').insert(category).select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async updateCategory(id: string, category: Partial<Category>) {
    const { data, error } = await this.supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async deleteCategory(id: string) {
    const { data, error } = await this.supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  // --- Expense APIs ---
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*, categories(*)')
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getMonthlyTotal(): Promise<number> {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { data, error } = await this.supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', startDate)
      .lte('expense_date', today);
    if (error) throw error;
    return (data || []).reduce((sum, item) => sum + Number(item.amount), 0);
  }

  async addExpense(expense: Partial<Expense>) {
    const { data, error } = await this.supabase.from('expenses').insert(expense).select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async updateExpense(id: string, expense: Partial<Expense>) {
    const { data, error } = await this.supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async deleteExpense(id: string) {
    const { data, error } = await this.supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  // --- RESTORED: Reports Query ---
  async getFilteredExpenses(
    startDate: string,
    endDate: string,
    categoryIds: string[],
  ): Promise<Expense[]> {
    let query = this.supabase
      .from('expenses')
      .select('*, categories(*)')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}
