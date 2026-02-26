import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeesService } from '../../../../core/api/generated/api/employees.service';
import { EmployeeDto } from '../../../../core/api/generated/model/employeeDto';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employees-list.page.html',
  styleUrl: './employees-list.page.css',
})
export class EmployeesListPage {
  private api = inject(EmployeesService);

  employees = signal<EmployeeDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.api.apiEmployeesGet().subscribe({
      next: (data) => {
        this.employees.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error ?? 'Nepodařilo se načíst zaměstnance.');
        this.loading.set(false);
      },
    });
  }

  delete(e: EmployeeDto) {
    if (!e.id) return;
    if (!confirm(`Opravdu smazat zaměstnance #${e.id}?`)) return;

    this.api.apiEmployeesIdDelete(e.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error ?? 'Smazání se nezdařilo.'),
    });
  }
}
