import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Subscription } from 'rxjs';
import { Category, Expense } from '../../models/expense.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="app-header">
      <div class="header-container">
        <div class="actions">
          <button class="mobile-toggle" (click)="toggleMenu()">☰</button>
          <h1 class="brand">Expense:</h1>

          <div class="mtd-box">
            <span class="mtd-value">{{
              currentMonthTotal | currency: 'INR' : 'symbol' : '1.0-0'
            }}</span>
          </div>
        </div>
        <button class="btn-circle primary" (click)="openAddExpense()">+</button>
      </div>

      <nav class="nav-bar" [class.open]="isMenuOpen">
        <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu()">Dashboard</a>
        <a routerLink="/categories" routerLinkActive="active" (click)="closeMenu()">Categories</a>
        <a routerLink="/expenses" routerLinkActive="active" (click)="closeMenu()">Expenses</a>
        <a routerLink="/reports" routerLinkActive="active" (click)="closeMenu()">Reports</a>
      </nav>
    </header>

    <!-- Global Add Expense Modal -->
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
            <input
              type="text"
              [(ngModel)]="formData.description"
              name="description"
              placeholder="Optional notes..."
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      /* THIS FIXES THE STICKY OVERLAP */
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: 100;
        width: 100%;
      }

      .app-header {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .brand {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #4f46e5;
        letter-spacing: -0.025em;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .mtd-box {
        background: #eff6ff;
        padding: 0.4rem 0.75rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
      }
      .mtd-value {
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e3a8a;
      }

      .mobile-toggle {
        display: none;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #374151;
        cursor: pointer;
        padding: 0.25rem;
      }

      .nav-bar {
        display: flex;
        gap: 1.5rem;
        padding: 0 1.5rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }
      .nav-bar a {
        padding: 0.75rem 0;
        color: #4b5563;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        border-bottom: 2px solid transparent;
      }
      .nav-bar a:hover {
        color: #111827;
      }
      .nav-bar a.active {
        color: #4f46e5;
        border-bottom-color: #4f46e5;
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
        outline: none;
      }
      .input-group input:focus,
      .input-group select:focus {
        border-color: #4f46e5;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }

      @media (max-width: 640px) {
        .header-container {
          padding: 0.75rem 1rem;
          gap: 0.5rem;
        }
        .brand {
          font-size: 1.1rem;
        }
        .mobile-toggle {
          display: block;
        }

        .nav-bar {
          flex-direction: column;
          gap: 0;
          padding: 0;
          display: none;
          position: absolute;
          width: 100%;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .nav-bar.open {
          display: flex;
        }
        .nav-bar a {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .nav-bar a.active {
          border-bottom: 1px solid #f3f4f6;
          border-left: 3px solid #4f46e5;
          background: #eff6ff;
        }
      }
    `,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentMonthTotal = 0;
  isMenuOpen = false;
  showModal = false;
  categories: Category[] = [];
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

  ngOnInit() {
    this.fetchMonthlyTotal();
    this.sub = this.supabaseService.refresh$.subscribe(() => {
      this.fetchMonthlyTotal();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  async fetchMonthlyTotal() {
    this.currentMonthTotal = await this.supabaseService.getMonthlyTotal();
    this.cdr.detectChanges();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu() {
    this.isMenuOpen = false;
  }

  async openAddExpense() {
    this.categories = await this.supabaseService.getCategories();
    this.formData = {
      category_id: this.categories[0]?.id || '',
      amount: null as any,
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
  }

  async saveExpense() {
    await this.supabaseService.addExpense(this.formData);
    this.closeModal();
  }
}
