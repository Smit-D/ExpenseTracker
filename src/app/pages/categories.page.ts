import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { Category } from '../models/expense.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="header-action">
        <h2>Categories</h2>
        <button class="btn-circle primary" (click)="openModal()">+</button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Target (₹)</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cat of categories">
              <td class="font-bold">{{ cat.name }}</td>
              <td>
                {{
                  cat.target_amount
                    ? (cat.target_amount | currency: 'INR' : 'symbol' : '1.0-0')
                    : '--'
                }}
              </td>
              <td style="text-align: right;">
                <button class="icon-btn" (click)="openModal(cat)">✎</button>
                <button class="icon-btn text-red" (click)="deleteCategory(cat.id)">✕</button>
              </td>
            </tr>
            <tr *ngIf="categories.length === 0">
              <td colspan="3" class="empty-state">No categories found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal (Title Removed) -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <form (ngSubmit)="saveCategory()">
            <div class="input-group">
              <label>Name</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                required
                placeholder="e.g. Groceries"
              />
            </div>
            <div class="input-group">
              <label>Monthly Target (₹)</label>
              <input
                type="number"
                [(ngModel)]="formData.target_amount"
                name="target"
                placeholder="0"
              />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline secondary-button" (click)="closeModal()">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary primary-button">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
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
      .input-group input {
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
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  showModal = false;
  editingId: string | null = null;
  formData: { name: string; target_amount?: number } = { name: '', target_amount: null as any };
  private sub!: Subscription;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.sub = this.supabaseService.refresh$.subscribe(() => {
      this.loadCategories();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  async loadCategories() {
    this.categories = await this.supabaseService.getCategories();
    this.cdr.detectChanges();
  }

  openModal(cat?: Category) {
    if (cat) {
      this.editingId = cat.id;
      this.formData = { name: cat.name, target_amount: cat.target_amount };
    } else {
      this.editingId = null;
      this.formData = { name: '', target_amount: null as any };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCategory() {
    this.editingId
      ? await this.supabaseService.updateCategory(this.editingId, this.formData)
      : await this.supabaseService.addCategory(this.formData);
    this.closeModal();
  }

  async deleteCategory(id: string) {
    if (confirm('Delete this category?')) {
      await this.supabaseService.deleteCategory(id);
    }
  }
}
