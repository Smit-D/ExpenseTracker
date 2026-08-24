import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="welcome-header">
        <h2>Welcome back! 👋</h2>
        <p>Here is your financial snapshot for this month.</p>
      </div>

      <div class="dashboard-grid">
        <!-- Chart Section with Centered Total -->
        <div class="chart-glass-card">
          <div class="chart-header">
            <h3>Expense Distribution</h3>
          </div>
          <div class="canvas-wrapper">
            <canvas #chartCanvas></canvas>

            <!-- Centered Overlay for Total -->
            <div class="chart-center-text" *ngIf="totalSpent > 0">
              <span class="center-label">Total MTD</span>
              <span class="center-value">{{
                totalSpent | currency: 'INR' : 'symbol' : '1.0-0'
              }}</span>
            </div>
          </div>
        </div>

        <!-- Animated Category Cards -->
        <div class="category-cards">
          <div *ngFor="let item of categoryBreakdown" class="cat-card">
            <div class="cat-info">
              <span
                class="cat-icon"
                [ngStyle]="{ background: item.color + '20', color: item.color }"
              >
                {{ item.name.charAt(0) }}
              </span>
              <h4>{{ item.name }}</h4>
            </div>
            <div class="cat-amounts">
              <p class="spent">{{ item.spent | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
              <p class="target" *ngIf="item.target">
                of {{ item.target | currency: 'INR' : 'symbol' : '1.0-0' }}
              </p>
            </div>
            <div class="progress-bar" *ngIf="item.target">
              <div
                class="progress-fill"
                [style.width.%]="(item.spent / item.target) * 100"
                [style.background]="item.spent > item.target ? '#ef4444' : item.color"
              ></div>
            </div>
          </div>

          <div *ngIf="categoryBreakdown.length === 0" style="color: #64748b; padding: 1rem;">
            No expenses logged this month.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 2.5rem 1.5rem;
        max-width: 1000px;
        margin: 0 auto;
        height: 100%;
        box-sizing: border-box;
      }

      .welcome-header {
        margin-bottom: 2rem;
        margin-top: 0;
      }
      .welcome-header h2 {
        margin: 0;
        font-size: 1.8rem;
        color: #1e293b;
        font-weight: 800;
        letter-spacing: -0.5px;
      }
      .welcome-header p {
        margin: 0.5rem 0 0 0;
        color: #64748b;
        font-size: 1rem;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 2rem;
      }

      .chart-glass-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        display: flex;
        flex-direction: column;
      }
      .chart-header h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #334155;
        font-weight: 700;
      }

      /* Wrapper handles relative positioning for absolute center text */
      .canvas-wrapper {
        position: relative;
        height: 300px;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .chart-center-text {
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      }
      .center-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 0.2rem;
      }
      .center-value {
        font-size: 1.6rem;
        font-weight: 800;
        color: #1e293b;
        line-height: 1;
      }

      .category-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1rem;
        align-content: start;
      }
      .cat-card {
        background: #fff;
        padding: 1.25rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        border: 1px solid #e5e7eb;
      }

      .cat-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .cat-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.1rem;
      }
      .cat-info h4 {
        margin: 0;
        color: #1e293b;
        font-size: 1rem;
        font-weight: 600;
      }

      .cat-amounts {
        margin-bottom: 0.75rem;
      }
      .spent {
        font-size: 1.4rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        line-height: 1;
      }
      .target {
        font-size: 0.8rem;
        color: #64748b;
        margin: 0.25rem 0 0 0;
        font-weight: 500;
      }

      .progress-bar {
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
        width: 100%;
      }
      .progress-fill {
        height: 100%;
        border-radius: 4px;
      }

      @media (max-width: 800px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .page-container {
          padding: 1.5rem 1rem;
        }
        .welcome-header h2 {
          font-size: 1.4rem;
        }
        .welcome-header p {
          font-size: 0.9rem;
        }
        .chart-glass-card {
          padding: 1rem;
        }
        .canvas-wrapper {
          height: 260px;
        }
        .center-value {
          font-size: 1.3rem;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  categoryBreakdown: any[] = [];
  chart: Chart | null = null;
  totalSpent: number = 0;
  private sub!: Subscription;

  colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadData();
    this.sub = this.supabaseService.refresh$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.categoryBreakdown.length > 0) this.renderChart();
  }

  async loadData() {
    const categories = await this.supabaseService.getCategories();
    const expenses = await this.supabaseService.getExpenses();

    const now = new Date();
    const currentMonthExpenses = expenses.filter((e: { expense_date: string | number | Date }) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    this.categoryBreakdown = categories
      .map((cat: any, index: number) => {
        const spent = currentMonthExpenses
          .filter((e: { category_id: any }) => e.category_id === cat.id)
          .reduce((sum: number, e: { amount: any }) => sum + Number(e.amount), 0);

        return {
          name: cat.name,
          spent,
          target: cat.target_amount || 0,
          color: this.colors[index % this.colors.length],
        };
      })
      .sort((a: { spent: number }, b: { spent: number }) => b.spent - a.spent);

    this.totalSpent = this.categoryBreakdown.reduce((sum, item) => sum + item.spent, 0);

    this.cdr.detectChanges();
    this.renderChart();
  }

  renderChart() {
    if (!this.chartCanvas || this.totalSpent === 0) return;
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.categoryBreakdown.map((c) => c.name),
        datasets: [
          {
            data: this.categoryBreakdown.map((c) => c.spent),
            backgroundColor: this.categoryBreakdown.map((c) => c.color),
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Inter' },
          },
        },
        animation: { animateScale: true, animateRotate: true, duration: 1500 },
      },
    });
  }
}
