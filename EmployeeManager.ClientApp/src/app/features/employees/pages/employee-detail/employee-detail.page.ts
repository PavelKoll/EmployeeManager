import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { EmployeesService } from '../../../../core/api/generated/api/employees.service';
import { AddressesService } from '../../../../core/api/generated/api/addresses.service';
import { CitiesService } from '../../../../core/api/generated/api/cities.service';
import { CountriesService } from '../../../../core/api/generated/api/countries.service';
import { JobCategoriesService } from '../../../../core/api/generated/api/jobCategories.service';
import { SalariesService } from '../../../../core/api/generated/api/salaries.service';

import { EmployeeDto } from '../../../../core/api/generated/model/employeeDto';
import { AddressDto } from '../../../../core/api/generated/model/addressDto';
import { CityDto } from '../../../../core/api/generated/model/cityDto';
import { CountryDto } from '../../../../core/api/generated/model/countryDto';
import { JobCategoryDto } from '../../../../core/api/generated/model/jobCategoryDto';
import { SalaryDto } from '../../../../core/api/generated/model/salaryDto';
import { Gender } from '../../../../core/api/generated/model/gender';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-detail.page.html',
  styleUrl: './employee-detail.page.css',
})
export class EmployeeDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private employeesApi = inject(EmployeesService);
  private addressesApi = inject(AddressesService);
  private citiesApi = inject(CitiesService);
  private countriesApi = inject(CountriesService);
  private jobCategoriesApi = inject(JobCategoriesService);
  private salariesApi = inject(SalariesService);

  employee = signal<EmployeeDto | null>(null);
  salaries = signal<SalaryDto[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);

  currentSalary = signal<number | null>(null);

  private employeeById = new Map<number, EmployeeDto>();
  private addressById = new Map<number, AddressDto>();
  private cityById = new Map<number, CityDto>();
  private countryById = new Map<number, CountryDto>();
  private jobCategoryById = new Map<number, JobCategoryDto>();

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pm) => {
        const id = Number(pm.get('id'));
        if (Number.isFinite(id) && id > 0) {
          this.load(id);
        } else {
          this.employee.set(null);
          this.error.set('Neplatné ID.');
        }
      });
  }

  private load(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.employee.set(null);
    this.salaries.set([]);
    this.currentSalary.set(null);

    forkJoin({
      employee: this.employeesApi.apiEmployeesIdGet(id),
      employees: this.employeesApi.apiEmployeesGet(),
      addresses: this.addressesApi.apiAddressesGet(),
      cities: this.citiesApi.apiCitiesGet(),
      countries: this.countriesApi.apiCountriesGet(),
      jobCategories: this.jobCategoriesApi.apiJobCategoriesGet(),
      salaries: this.salariesApi.apiSalariesGet(id),
    }).subscribe({
      next: (res) => {
        this.employeeById.clear();
        (res.employees ?? []).forEach(e => { if (e.id != null) this.employeeById.set(e.id, e); });

        this.addressById.clear();
        (res.addresses ?? []).forEach(a => { if (a.id != null) this.addressById.set(a.id, a); });

        this.cityById.clear();
        (res.cities ?? []).forEach(c => { if (c.id != null) this.cityById.set(c.id, c); });

        this.countryById.clear();
        (res.countries ?? []).forEach(c => { if (c.id != null) this.countryById.set(c.id, c); });

        this.jobCategoryById.clear();
        (res.jobCategories ?? []).forEach(j => { if (j.id != null) this.jobCategoryById.set(j.id, j); });

        const list = res.salaries ?? [];
        this.employee.set(res.employee ?? null);
        this.salaries.set(list);
        this.currentSalary.set(this.computeCurrentSalary(list));

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error ?? 'Nepodařilo se načíst zaměstnance.');
        this.loading.set(false);
      },
    });
  }

  private computeCurrentSalary(list: SalaryDto[]): number | null {
    if (!list?.length) return null;

    const now = Date.now();
    const normalized = list.map(s => ({
      s,
      from: s.from ? Date.parse(s.from) : Number.NEGATIVE_INFINITY,
      to: s.to ? Date.parse(s.to) : Number.POSITIVE_INFINITY,
    }));

    const currentCandidates = normalized.filter(x => x.to >= now);
    const pick = (arr: typeof normalized) =>
      arr.slice().sort((a, b) => (b.from - a.from))[0]?.s?.amount ?? null;

    return pick(currentCandidates.length ? currentCandidates : normalized);
  }

  delete() {
    const e = this.employee();
    if (!e?.id) return;

    if (!confirm(`Opravdu smazat zaměstnance #${e.id}?`)) return;

    this.employeesApi.apiEmployeesIdDelete(e.id).subscribe({
      next: () => this.router.navigateByUrl('/employees'),
      error: (err) => this.error.set(err?.error ?? 'Smazání se nezdařilo.'),
    });
  }

  asDate(iso?: string | null): string {
    return iso ? iso.slice(0, 10) : '-';
  }

  genderLabel(g?: Gender): string {
    if (g === 0) return 'Muž';
    if (g === 1) return 'Žena';
    if (g === 2) return 'Neurčeno';
    return '-';
  }

  employeeName(id?: number | null): string {
    if (!id) return '-';
    const e = this.employeeById.get(id);
    if (!e) return 'Neznámý';
    return `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || 'Neznámý';
  }

  addressLabelById(id?: number | null): string {
    if (!id) return '-';
    const a = this.addressById.get(id);
    if (!a) return 'Neznámá adresa';

    const street = [a.street ?? '', a.houseNumber ?? ''].join(' ').trim();
    const zip = a.zipCode ?? '';
    const city = a.cityId != null ? (this.cityById.get(a.cityId)?.name ?? '') : '';
    const country = a.countryId != null ? (this.countryById.get(a.countryId)?.name ?? '') : '';
    return [street, zip, city, country].filter(Boolean).join(', ') || 'Neznámá adresa';
  }

  jobCategoryName(id: number): string {
    return this.jobCategoryById.get(id)?.name ?? 'Neznámá pozice';
  }
}
