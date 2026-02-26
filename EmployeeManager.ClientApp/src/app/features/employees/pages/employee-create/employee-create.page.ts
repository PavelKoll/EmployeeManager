import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { EmployeesService } from '../../../../core/api/generated/api/employees.service';
import { AddressesService } from '../../../../core/api/generated/api/addresses.service';
import { CitiesService } from '../../../../core/api/generated/api/cities.service';
import { CountriesService } from '../../../../core/api/generated/api/countries.service';
import { JobCategoriesService } from '../../../../core/api/generated/api/jobCategories.service';
import { SalariesService } from '../../../../core/api/generated/api/salaries.service';

import { EmployeeDto } from '../../../../core/api/generated/model/employeeDto';
import { EmployeeCreateDto } from '../../../../core/api/generated/model/employeeCreateDto';
import { AddressDto } from '../../../../core/api/generated/model/addressDto';
import { CityDto } from '../../../../core/api/generated/model/cityDto';
import { CountryDto } from '../../../../core/api/generated/model/countryDto';
import { JobCategoryDto } from '../../../../core/api/generated/model/jobCategoryDto';
import { Gender } from '../../../../core/api/generated/model/gender';
import { SalaryCreateDto } from '../../../../core/api/generated/model/salaryCreateDto';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './employee-create.page.html',
  styleUrl: './employee-create.page.css',
})
export class EmployeeCreatePage {
  private router = inject(Router);

  private employeesApi = inject(EmployeesService);
  private addressesApi = inject(AddressesService);
  private citiesApi = inject(CitiesService);
  private countriesApi = inject(CountriesService);
  private jobCategoriesApi = inject(JobCategoriesService);
  private salariesApi = inject(SalariesService);

  loading = signal(false);
  saving = signal(false);
  ready = signal(false);
  error = signal<string | null>(null);

  superiors = signal<EmployeeDto[]>([]);
  addresses = signal<AddressDto[]>([]);
  jobCategories = signal<JobCategoryDto[]>([]);
  selectedJobCategoryIds = signal<number[]>([]);

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

    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phoneNumber: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),

    joinedDate: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),

    salaryAmount: new FormControl<number | null>(null),

    superiorId: new FormControl<number | null>(null),
    addressId: new FormControl<number | null>(null),
  });

  ngOnInit() {
    this.loadReferenceData();
  }

  private loadReferenceData() {
    this.loading.set(true);
    this.ready.set(false);
    this.error.set(null);

    forkJoin({
      employees: this.employeesApi.apiEmployeesGet(),
      addresses: this.addressesApi.apiAddressesGet(),
      cities: this.citiesApi.apiCitiesGet(),
      countries: this.countriesApi.apiCountriesGet(),
      jobCategories: this.jobCategoriesApi.apiJobCategoriesGet(),
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

        this.superiors.set(res.employees ?? []);
        this.addresses.set(res.addresses ?? []);
        this.jobCategories.set(res.jobCategories ?? []);
        this.selectedJobCategoryIds.set([]);

        this.loading.set(false);
        this.ready.set(true);
      },
      error: (err) => {
        this.error.set(err?.error ?? 'Selhalo načtení referenčních dat.');
        this.loading.set(false);
        this.ready.set(false);
      },
    });
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

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const salaryAmount = v.salaryAmount;

    const dto: EmployeeCreateDto = {
      firstName: v.firstName,
      lastName: v.lastName,
      middleName: v.middleName ? v.middleName : null,

      birthDate: this.toApiDateTime(v.birthDate),
      gender: v.gender,

      email: v.email,
      phoneNumber: v.phoneNumber,

      joinedDate: this.toApiDateTime(v.joinedDate),

      superiorId: v.superiorId ?? null,
      addressId: v.addressId ?? null,

      jobCategoryIds: this.selectedJobCategoryIds(),
    };

    this.saving.set(true);
    this.error.set(null);

    this.employeesApi.apiEmployeesPost(dto).subscribe({
      next: (created: any) => {
        const newId = typeof created === 'number' ? created : created?.id;
        if (!newId) {
          this.saving.set(false);
          this.router.navigateByUrl('/employees');
          return;
        }

        const hasSalary = salaryAmount != null && Number(salaryAmount) > 0;
        if (!hasSalary) {
          this.saving.set(false);
          this.router.navigateByUrl(`/employees/${newId}`);
          return;
        }

        const sDto: SalaryCreateDto = { employeeId: newId, amount: Number(salaryAmount) };

        this.salariesApi.apiSalariesPost(sDto).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigateByUrl(`/employees/${newId}`);
          },
          error: () => {
            this.saving.set(false);
            this.router.navigateByUrl(`/employees/${newId}`);
          },
        });
      },
      error: (err) => {
        this.error.set(err?.error ?? 'Vytvoření se nezdařilo.');
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

  private toApiDateTime(date: string): string {
    return `${date}T00:00:00`;
  }
}
