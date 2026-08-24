import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environment';
import { Category, Expense } from '../models/expense.model';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private workspaceId: string;

  private refreshTrigger = new Subject<void>();
  refresh$ = this.refreshTrigger.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.workspaceId = this.getOrCreateWorkspaceId();
  }

  // Generate or retrieve a persistent isolated workspace for this browser session
  private getOrCreateWorkspaceId(): string {
    let id = localStorage.getItem('app_workspace_id');
    if (!id) {
      id = 'ws_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('app_workspace_id', id);
    }
    return id;
  }

  // Allow users to switch or switch-in another workspace via a unique key sharing link if desired
  public getWorkspaceId(): string {
    return this.workspaceId;
  }

  public setWorkspaceId(id: string) {
    localStorage.setItem('app_workspace_id', id);
    this.workspaceId = id;
    this.notifyDataChanged();
  }

  notifyDataChanged() {
    this.refreshTrigger.next();
  }

  // --- Category APIs (Workspace Isolated) ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async addCategory(category: Partial<Category>) {
    const payload = { ...category, workspace_id: this.workspaceId };
    const { data, error } = await this.supabase.from('categories').insert(payload).select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async updateCategory(id: string, category: Partial<Category>) {
    const { data, error } = await this.supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .eq('workspace_id', this.workspaceId)
      .select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async deleteCategory(id: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId);
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  // --- Expense APIs (Workspace Isolated) ---
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*, categories(*)')
      .eq('workspace_id', this.workspaceId)
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
      .eq('workspace_id', this.workspaceId)
      .gte('expense_date', startDate)
      .lte('expense_date', today);

    if (error) throw error;
    return (data || []).reduce((sum, item) => sum + Number(item.amount), 0);
  }

  async addExpense(expense: Partial<Expense>) {
    const payload = { ...expense, workspace_id: this.workspaceId };
    const { data, error } = await this.supabase.from('expenses').insert(payload).select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async updateExpense(id: string, expense: Partial<Expense>) {
    const { data, error } = await this.supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .eq('workspace_id', this.workspaceId)
      .select();
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  async deleteExpense(id: string) {
    const { data, error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId);
    if (error) throw error;
    this.notifyDataChanged();
    return data;
  }

  // --- Reports Query (Workspace Isolated) ---
  async getFilteredExpenses(
    startDate: string,
    endDate: string,
    categoryIds: string[],
  ): Promise<Expense[]> {
    let query = this.supabase
      .from('expenses')
      .select('*, categories(*)')
      .eq('workspace_id', this.workspaceId)
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
