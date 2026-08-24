import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { Category, Expense } from '../models/expense.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Expense Reports</h2>
      </div>

      <div class="card filter-section">
        <div class="date-row">
          <div class="form-group">
            <label>From Date</label>
            <input type="date" [(ngModel)]="startDate" />
          </div>
          <div class="form-group">
            <label>To Date</label>
            <input type="date" [(ngModel)]="endDate" />
          </div>
        </div>

        <div class="form-group">
          <label>Filter by Category</label>
          <div class="category-chips">
            <button
              *ngFor="let cat of categories"
              type="button"
              class="chip"
              [class.active]="selectedCategories.includes(cat.id)"
              (click)="toggleCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
            <div *ngIf="categories.length === 0" class="text-muted">No categories loaded.</div>
          </div>
        </div>

        <button class="btn btn-primary generate-btn" (click)="applyFilter()">
          Generate Report
        </button>
      </div>

      <div class="summary-banner" *ngIf="filteredExpenses.length > 0">
        <span class="summary-title">Total Filtered</span>
        <span class="summary-amount">{{
          filteredTotal | currency: 'INR' : 'symbol' : '1.0-0'
        }}</span>
      </div>

      <div class="card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let exp of filteredExpenses">
              <td>{{ exp.expense_date | date: 'mediumDate' }}</td>
              <td>
                <span class="badge">{{ exp.categories?.name }}</span>
              </td>
              <td class="text-muted">{{ exp.description || '--' }}</td>
              <td class="text-right font-medium">
                {{ exp.amount | currency: 'INR' : 'symbol' : '1.0-0' }}
              </td>
            </tr>
            <tr *ngIf="filteredExpenses.length === 0">
              <td colspan="4" class="empty-state">No expenses found for this duration.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      .page-header h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
      }

      .card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        margin-bottom: 1.5rem;
      }
      .filter-section {
        padding: 1.5rem;
      }

      .date-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }
      .form-group input {
        width: 100%;
      }

      /* Clean Category Chips instead of ugly Select */
      .category-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .chip {
        padding: 0.4rem 0.8rem;
        border-radius: 9999px;
        border: 1px solid #d1d5db;
        background: #f9fafb;
        color: #374151;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .chip:hover {
        background: #f3f4f6;
      }
      .chip.active {
        background: #eff6ff;
        border-color: #3b82f6;
        color: #1d4ed8;
        font-weight: 500;
      }

      .generate-btn {
        margin-top: 1.5rem;
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
      }

      .summary-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }
      .summary-title {
        font-weight: 600;
        color: #1e40af;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
      }
      .summary-amount {
        font-weight: 700;
        color: #1e3a8a;
        font-size: 1.25rem;
      }

      .table-card {
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
      .data-table tr:last-child td {
        border-bottom: none;
      }

      .text-right {
        text-align: right;
      }
      .text-muted {
        color: #6b7280;
      }
      .font-medium {
        font-weight: 500;
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
      .empty-state {
        text-align: center;
        color: #6b7280;
        padding: 3rem 1rem;
      }

      @media (max-width: 600px) {
        .date-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReportsComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  filteredExpenses: Expense[] = [];
  startDate: string = '';
  endDate: string = '';
  selectedCategories: string[] = []; // Array to hold selected chip IDs
  filteredTotal: number = 0;
  private sub!: Subscription;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.categories = await this.supabaseService.getCategories();

    const now = new Date();
    this.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    this.endDate = now.toISOString().split('T')[0];

    await this.applyFilter();

    this.sub = this.supabaseService.refresh$.subscribe(() => {
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  // New logic to handle clickable category chips
  toggleCategory(id: string) {
    const index = this.selectedCategories.indexOf(id);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(id);
    }
  }

  async applyFilter() {
    this.filteredExpenses = await this.supabaseService.getFilteredExpenses(
      this.startDate,
      this.endDate,
      this.selectedCategories,
    );
    this.filteredTotal = this.filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    this.cdr.detectChanges();
  }
}
