import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'employees' },

  {
    path: 'employees',
    loadComponent: () =>
      import('./features/employees/pages/employees-list/employees-list.page').then(m => m.EmployeesListPage),
  },

  // ✅ MUSÍ být před employees/:id
  {
    path: 'employees/new',
    loadComponent: () =>
      import('./features/employees/pages/employee-create/employee-create.page').then(m => m.EmployeeCreatePage),
  },

  // ✅ taky je lepší dát před employees/:id (specifičtější)
  {
    path: 'employees/:id/edit',
    loadComponent: () =>
      import('./features/employees/pages/employee-edit/employee-edit.page').then(m => m.EmployeeEditPage),
  },

  {
    path: 'employees/:id',
    loadComponent: () =>
      import('./features/employees/pages/employee-detail/employee-detail.page').then(m => m.EmployeeDetailPage),
  },
  {
    path: 'metadata',
    loadComponent: () =>
      import('./features/metadata/pages/metadata/metadata.page').then(m => m.MetadataPage),
  },

  { path: '**', redirectTo: 'employees' },
];