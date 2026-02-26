import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EmployeesService } from '../../../../core/api/generated/api/employees.service';
import { AddressesService } from '../../../../core/api/generated/api/addresses.service';
import { CitiesService } from '../../../../core/api/generated/api/cities.service';
import { CountriesService } from '../../../../core/api/generated/api/countries.service';
import { JobCategoriesService } from '../../../../core/api/generated/api/jobCategories.service';
import { SalariesService } from '../../../../core/api/generated/api/salaries.service';

import { EmployeeDto } from '../../../../core/api/generated/model/employeeDto';
import { EmployeeUpdateDto } from '../../../../core/api/generated/model/employeeUpdateDto';
import { AddressDto } from '../../../../core/api/generated/model/addressDto';
import { CityDto } from '../../../../core/api/generated/model/cityDto';
import { CountryDto } from '../../../../core/api/generated/model/countryDto';
import { JobCategoryDto } from '../../../../core/api/generated/model/jobCategoryDto';
import { Gender } from '../../../../core/api/generated/model/gender';
import { SalaryDto } from '../../../../core/api/generated/model/salaryDto';
import { SalaryUpdateDto } from '../../../../core/api/generated/model/salaryUpdateDto';
import { SalaryCreateDto } from '../../../../core/api/generated/model/salaryCreateDto';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './employee-edit.page.html',
  styleUrl: './employee-edit.page.css',
})
export class EmployeeEditPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private employeesApi = inject(EmployeesService);
  private addressesApi = inject(AddressesService);
  private citiesApi = inject(CitiesService);
  private countriesApi = inject(CountriesService);
  private jobCategoriesApi = inject(JobCategoriesService);
  private salariesApi = inject(SalariesService);

  employeeId = signal<number>(0);

  loading = signal(false);
  saving = signal(false);
  ready = signal(false);
  error = signal<string | null>(null);

  superiors = signal<EmployeeDto[]>([]);
  addresses = signal<AddressDto[]>([]);
  jobCategories = signal<JobCategoryDto[]>([]);
  selectedJobCategoryIds = signal<number[]>([]);

  salaries = signal<SalaryDto[]>([]);
  salaryError = signal<string | null>(null);
  editingSalaryId = signal<number | null>(null);

  private loadedCurrentSalary: number | null = null;

  private cityNameById = new Map<number, string>();
  private countryNameById = new Map<number, string>();

  genderOptions: Array<{ value: Gender; label: string }> = [
    { value: 0 as Gender, label: 'Muž' },
    { value: 1 as Gender, label: 'Žena' },
    { value: 2 as Gender, label: 'Neurčeno' },
  ];

  form = new FormGroup({
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    middleName: new FormControl<string>('', { nonNullable: true }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    birthDate: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),

    gender: new FormControl<Gender>(0 as Gender, { nonNullable: true, validators: [Validators.required] }),

    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phoneNumber: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),

    joinedDate: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    exitedDate: new FormControl<string>('', { nonNullable: true }),

    superiorId: new FormControl<number | null>(null),
    addressId: new FormControl<number | null>(null),

    salaryAmount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
  });

  salaryRowForm = new FormGroup({
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    from: new FormControl<string>('', { nonNullable: true }),
    to: new FormControl<string>('', { nonNullable: true }),
  });

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pm) => {
        const id = Number(pm.get('id'));
        if (!Number.isFinite(id) || id <= 0) {
          this.error.set('Neplatné ID.');
          return;
        }
        this.employeeId.set(id);
        this.loadAll(id);
      });
  }

  private loadAll(id: number) {
    this.loading.set(true);
    this.ready.set(false);
    this.error.set(null);

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
        this.cityNameById.clear();
        (res.cities ?? []).forEach((c: CityDto) => {
          if (c.id != null) this.cityNameById.set(c.id, c.name ?? '');
        });

        this.countryNameById.clear();
        (res.countries ?? []).forEach((c: CountryDto) => {
          if (c.id != null) this.countryNameById.set(c.id, c.name ?? '');
        });

        const allEmployees = res.employees ?? [];
        this.superiors.set(allEmployees.filter(e => e.id != null && e.id !== id));
        this.addresses.set(res.addresses ?? []);
        this.jobCategories.set(res.jobCategories ?? []);

        const e = res.employee;
        this.form.patchValue({
          firstName: e.firstName ?? '',
          middleName: e.middleName ?? '',
          lastName: e.lastName ?? '',
          birthDate: this.toDateInput(e.birthDate),
          gender: (e.gender ?? (0 as Gender)),
          email: e.email ?? '',
          phoneNumber: e.phoneNumber ?? '',
          joinedDate: this.toDateInput(e.joinedDate),
          exitedDate: this.toDateInput(e.exitedDate),
          superiorId: e.superiorId ?? null,
          addressId: e.addressId ?? null,
        });

        this.selectedJobCategoryIds.set((e.jobCategoryIds ?? []).filter((x): x is number => typeof x === 'number'));

        const list = res.salaries ?? [];
        this.salaries.set(list);
        this.salaryError.set(null);
        this.editingSalaryId.set(null);
        this.cancelSalaryEdit();

        const current = this.computeCurrentSalary(list);
        this.loadedCurrentSalary = current;
        this.form.patchValue({ salaryAmount: current });

        this.loading.set(false);
        this.ready.set(true);
      },
      error: (err) => {
        this.error.set(err?.error ?? 'Nepodařilo se načíst data pro úpravu.');
        this.loading.set(false);
        this.ready.set(false);
      },
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.employeeId();
    const v = this.form.getRawValue();

    const dto: EmployeeUpdateDto = {
      firstName: v.firstName,
      lastName: v.lastName,
      middleName: v.middleName ? v.middleName : null,

      birthDate: this.toApiDateTime(v.birthDate),
      gender: v.gender,

      email: v.email,
      phoneNumber: v.phoneNumber,

      joinedDate: this.toApiDateTime(v.joinedDate),
      exitedDate: v.exitedDate ? this.toApiDateTime(v.exitedDate) : null,

      superiorId: v.superiorId ?? null,
      addressId: v.addressId ?? null,

      jobCategoryIds: this.selectedJobCategoryIds(),
    };

    this.saving.set(true);
    this.error.set(null);
    this.salaryError.set(null);

    this.employeesApi.apiEmployeesIdPut(id, dto).subscribe({
      next: () => {
        const newSalary = Number(this.form.controls.salaryAmount.value);
        const oldSalary = this.loadedCurrentSalary;

        const salaryChanged =
          Number.isFinite(newSalary) &&
          newSalary > 0 &&
          (oldSalary == null || newSalary !== oldSalary);

        if (!salaryChanged) {
          this.saving.set(false);
          this.router.navigateByUrl(`/employees/${id}`);
          return;
        }

        const salaryDto: SalaryCreateDto = {
          employeeId: id,
          amount: newSalary,
        };

        this.salariesApi.apiSalariesPost(salaryDto).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigateByUrl(`/employees/${id}`);
          },
          error: (err) => {
            this.salaryError.set(err?.error ?? 'Nepodařilo se vytvořit nový plat.');
            this.saving.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err?.error ?? 'Uložení se nezdařilo.');
        this.saving.set(false);
      },
    });
  }

  addressLabel(a: AddressDto): string {
    const street = [a.street ?? '', a.houseNumber ?? ''].join(' ').trim();
    const zip = a.zipCode ?? '';
    const city = a.cityId != null ? (this.cityNameById.get(a.cityId) ?? '') : '';
    const country = a.countryId != null ? (this.countryNameById.get(a.countryId) ?? '') : '';
    return [street, zip, city, country].filter(Boolean).join(', ');
  }

  genderText(): string {
    return this.genderOptions.find(x => x.value === this.form.controls.gender.value)?.label ?? 'Vyberte';
  }

  setGender(g: Gender) {
    this.form.controls.gender.setValue(g);
    this.form.controls.gender.markAsTouched();
  }

  superiorText(): string {
    const id = this.form.controls.superiorId.value;
    if (id == null) return '— žádný —';
    const e = this.superiors().find(x => x.id === id);
    return e ? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() : '— žádný —';
  }

  setSuperior(id: number | null) {
    this.form.controls.superiorId.setValue(id);
  }

  addressText(): string {
    const id = this.form.controls.addressId.value;
    if (id == null) return '— žádná —';
    const a = this.addresses().find(x => x.id === id);
    return a ? this.addressLabel(a) : '— žádná —';
  }

  setAddress(id: number | null) {
    this.form.controls.addressId.setValue(id);
  }

  jobCategoriesText(): string {
    const cnt = this.selectedJobCategoryIds().length;
    return cnt ? `Vybráno (${cnt})` : '— žádné —';
  }

  clearJobCategories() {
    this.selectedJobCategoryIds.set([]);
  }

  isJobCategorySelected(id?: number): boolean {
    if (id == null) return false;
    return this.selectedJobCategoryIds().includes(id);
  }

  toggleJobCategory(id?: number, checked?: boolean) {
    if (id == null) return;
    const current = new Set(this.selectedJobCategoryIds());
    if (checked) current.add(id);
    else current.delete(id);
    this.selectedJobCategoryIds.set(Array.from(current).sort((a, b) => a - b));
  }

  startSalaryEdit(s: SalaryDto) {
    if (!s.id) return;
    this.salaryError.set(null);
    this.editingSalaryId.set(s.id);

    this.salaryRowForm.reset({
      amount: s.amount ?? null,
      from: s.from ? s.from.slice(0, 10) : '',
      to: s.to ? s.to.slice(0, 10) : '',
    });
  }

  cancelSalaryEdit() {
    this.editingSalaryId.set(null);
    this.salaryRowForm.reset({ amount: null, from: '', to: '' });
  }

  saveSalaryRow(id: number) {
    if (this.salaryRowForm.invalid) {
      this.salaryRowForm.markAllAsTouched();
      return;
    }

    const v = this.salaryRowForm.getRawValue();

    const dto: SalaryUpdateDto = {
      employeeId: this.employeeId(),
      amount: Number(v.amount),
      from: v.from ? this.toApiDateTime(v.from) : undefined,
      to: v.to ? this.toApiDateTime(v.to) : null,
    };

    this.saving.set(true);
    this.salaryError.set(null);

    this.salariesApi.apiSalariesIdPut(id, dto).subscribe({
      next: () => {
        this.salariesApi.apiSalariesGet(this.employeeId()).subscribe({
          next: (list) => {
            const salaries = list ?? [];
            this.salaries.set(salaries);

            const current = this.computeCurrentSalary(salaries);
            this.loadedCurrentSalary = current;
            this.form.patchValue({ salaryAmount: current });

            this.saving.set(false);
            this.cancelSalaryEdit();
          },
          error: () => {
            this.saving.set(false);
            this.cancelSalaryEdit();
          },
        });
      },
      error: (err) => {
        this.salaryError.set(err?.error ?? 'Aktualizace platu se nezdařila.');
        this.saving.set(false);
      },
    });
  }

  private toDateInput(iso?: string | null): string {
    return iso ? iso.slice(0, 10) : '';
  }

  private toApiDateTime(date: string): string {
    return `${date}T00:00:00`;
  }

  private computeCurrentSalary(list: SalaryDto[]): number | null {
    if (!list?.length) return null;

    const now = Date.now();

    const normalized = list.map(s => ({
      s,
      from: s.from ? Date.parse(s.from) : Number.NEGATIVE_INFINITY,
      to: s.to ? Date.parse(s.to) : Number.POSITIVE_INFINITY,
    }));

    const current = normalized.filter(x => x.to >= now);
    const pickFrom = (arr: typeof normalized) =>
      arr.slice().sort((a, b) => b.from - a.from)[0]?.s?.amount ?? null;

    return pickFrom(current.length ? current : normalized);
  }
}
