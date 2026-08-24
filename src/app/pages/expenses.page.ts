import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { Category, Expense } from '../models/expense.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="header-action">
        <h2>Expenses Log</h2>
        <button class="btn-circle primary" (click)="openModal()">+</button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount (₹)</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let exp of expenses">
              <td>
                <div class="date-txt">{{ exp.expense_date | date: 'mediumDate' }}</div>
                <div class="desc-txt">{{ exp.description || '--' }}</div>
              </td>
              <td>
                <span class="badge">{{ exp.categories?.name }}</span>
              </td>
              <td class="font-bold">{{ exp.amount | currency: 'INR' : 'symbol' : '1.0-0' }}</td>
              <td style="text-align: right;">
                <button class="icon-btn" (click)="openModal(exp)">✎</button>
                <button class="icon-btn text-red" (click)="deleteExpense(exp.id)">✕</button>
              </td>
            </tr>
            <tr *ngIf="expenses.length === 0">
              <td colspan="4" class="empty-state">No expenses found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal (Title Removed) -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <form (ngSubmit)="saveExpense()">
            <div class="input-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                step="1"
                [(ngModel)]="formData.amount"
                name="amount"
                required
                placeholder="0"
              />
            </div>
            <div class="input-group">
              <label>Category</label>
              <select [(ngModel)]="formData.category_id" name="category_id" required>
                <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Date</label>
              <input type="date" [(ngModel)]="formData.expense_date" name="expense_date" required />
            </div>
            <div class="input-group">
              <label>Description</label>
              <input type="text" [(ngModel)]="formData.description" name="description" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  // (Uses identical grid & layout styles to Categories Component)
  styles: [
    `
      .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      .header-action {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
      }

      .card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .data-table th {
        background: #f9fafb;
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        border-bottom: 1px solid #e5e7eb;
      }
      .data-table td {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.9rem;
        color: #111827;
      }

      .date-txt {
        font-weight: 500;
        color: #111827;
      }
      .desc-txt {
        font-size: 0.8rem;
        color: #6b7280;
      }
      .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #374151;
        font-weight: 500;
      }
      .font-bold {
        font-weight: 500;
      }
      .text-red {
        color: #ef4444 !important;
      }

      .icon-btn {
        background: none;
        border: none;
        font-size: 1.1rem;
        cursor: pointer;
        color: #6b7280;
        margin-left: 0.75rem;
      }
      .icon-btn:hover {
        color: #111827;
      }
      .empty-state {
        text-align: center;
        color: #6b7280;
        padding: 2rem 1rem;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-content {
        background: #fff;
        border-radius: 12px;
        padding: 1.5rem;
        width: 90%;
        max-width: 400px;
      }
      .input-group {
        margin-bottom: 1rem;
      }
      .input-group label {
        display: block;
        font-size: 0.85rem;
        color: #475569;
        margin-bottom: 0.3rem;
        font-weight: 500;
      }
      .input-group input,
      .input-group select {
        width: 100%;
        padding: 0.7rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        box-sizing: border-box;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }
    `,
  ],
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  categories: Category[] = [];
  showModal = false;
  editingId: string | null = null;
  formData: Partial<Expense> = {
    category_id: '',
    amount: null as any,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  };
  private sub!: Subscription;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.categories = await this.supabaseService.getCategories();
    this.loadData();
    this.sub = this.supabaseService.refresh$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  async loadData() {
    this.expenses = await this.supabaseService.getExpenses();
    this.cdr.detectChanges();
  }

  openModal(exp?: Expense) {
    if (exp) {
      this.editingId = exp.id;
      this.formData = {
        category_id: exp.category_id,
        amount: exp.amount,
        expense_date: exp.expense_date,
        description: exp.description,
      };
    } else {
      this.editingId = null;
      this.formData = {
        category_id: this.categories[0]?.id || '',
        amount: null as any,
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
      };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveExpense() {
    this.editingId
      ? await this.supabaseService.updateExpense(this.editingId, this.formData)
      : await this.supabaseService.addExpense(this.formData);
    this.closeModal();
  }

  async deleteExpense(id: string) {
    if (confirm('Delete this expense?')) {
      await this.supabaseService.deleteExpense(id);
    }
  }
}
