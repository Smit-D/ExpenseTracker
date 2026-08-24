import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.page';
import { CategoriesComponent } from './pages/categories.page';
import { ExpensesComponent } from './pages/expenses.page';
import { ReportsComponent } from './pages/reports.page';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'reports', component: ReportsComponent },
  { path: '**', redirectTo: 'dashboard' },
];
