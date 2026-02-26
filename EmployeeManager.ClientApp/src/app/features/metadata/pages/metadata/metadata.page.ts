import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CountriesService } from '../../../../core/api/generated/api/countries.service';
import { CitiesService } from '../../../../core/api/generated/api/cities.service';
import { AddressesService } from '../../../../core/api/generated/api/addresses.service';
import { JobCategoriesService } from '../../../../core/api/generated/api/jobCategories.service';

import { CountryDto } from '../../../../core/api/generated/model/countryDto';
import { CountryCreateDto } from '../../../../core/api/generated/model/countryCreateDto';
import { CountryUpdateDto } from '../../../../core/api/generated/model/countryUpdateDto';

import { CityDto } from '../../../../core/api/generated/model/cityDto';
import { CityCreateDto } from '../../../../core/api/generated/model/cityCreateDto';
import { CityUpdateDto } from '../../../../core/api/generated/model/cityUpdateDto';

import { AddressDto } from '../../../../core/api/generated/model/addressDto';
import { AddressCreateDto } from '../../../../core/api/generated/model/addressCreateDto';
import { AddressUpdateDto } from '../../../../core/api/generated/model/addressUpdateDto';

import { JobCategoryDto } from '../../../../core/api/generated/model/jobCategoryDto';
import { JobCategoryCreateDto } from '../../../../core/api/generated/model/jobCategoryCreateDto';
import { JobCategoryUpdateDto } from '../../../../core/api/generated/model/jobCategoryUpdateDto';

type Alert = { type: 'success' | 'danger' | 'info'; message: string } | null;

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './metadata.page.html',
  styleUrl: './metadata.page.css',
})
export class MetadataPage {
  private destroyRef = inject(DestroyRef);

  private countriesApi = inject(CountriesService);
  private citiesApi = inject(CitiesService);
  private addressesApi = inject(AddressesService);
  private jobCategoriesApi = inject(JobCategoriesService);

  loading = signal(false);

  countries = signal<CountryDto[]>([]);
  cities = signal<CityDto[]>([]);
  addresses = signal<AddressDto[]>([]);
  jobCategories = signal<JobCategoryDto[]>([]);

  private countryNameById = new Map<number, string>();
  private cityNameById = new Map<number, string>();

  countryAlert = signal<Alert>(null);
  cityAlert = signal<Alert>(null);
  addressAlert = signal<Alert>(null);
  jobCategoryAlert = signal<Alert>(null);

  editingCountryId = signal<number | null>(null);

  countryCreateForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true }),
  });

  countryEditForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true }),
  });

  editingCityId = signal<number | null>(null);

  cityCreateForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    countryId: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  cityEditForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    countryId: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  editingAddressId = signal<number | null>(null);

  addressCreateForm = new FormGroup({
    street: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    houseNumber: new FormControl('', { nonNullable: true }),
    zipCode: new FormControl('', { nonNullable: true }),
    cityId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    countryId: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  addressEditForm = new FormGroup({
    street: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    houseNumber: new FormControl('', { nonNullable: true }),
    zipCode: new FormControl('', { nonNullable: true }),
    cityId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    countryId: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  editingJobCategoryId = signal<number | null>(null);

  jobCategoryCreateForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  jobCategoryEditForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit() {
    this.loadAll();

    this.addressCreateForm.controls.cityId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cityId) => this.syncCountryFromCity(cityId, this.addressCreateForm));

    this.addressEditForm.controls.cityId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cityId) => this.syncCountryFromCity(cityId, this.addressEditForm));
  }

  private syncCountryFromCity(cityId: number | null, form: FormGroup<any>) {
    if (!cityId) return;
    const city = this.cities().find(c => c.id === cityId);
    if (!city?.countryId) return;

    form.controls['countryId'].setValue(city.countryId);
  }

  loadAll() {
    this.loading.set(true);
    this.clearAllAlerts();

    forkJoin({
      countries: this.countriesApi.apiCountriesGet(),
      cities: this.citiesApi.apiCitiesGet(),
      addresses: this.addressesApi.apiAddressesGet(),
      jobCategories: this.jobCategoriesApi.apiJobCategoriesGet(),
    }).subscribe({
      next: (res) => {
        this.countries.set(res.countries ?? []);
        this.cities.set(res.cities ?? []);
        this.addresses.set(res.addresses ?? []);
        this.jobCategories.set(res.jobCategories ?? []);

        this.rebuildMaps();
        this.loading.set(false);
        this.cancelAllEdits();
      },
      error: () => {
        this.loading.set(false);
        this.countryAlert.set({ type: 'danger', message: 'Nepodařilo se načíst číselníky.' });
      },
    });
  }

  private rebuildMaps() {
    this.countryNameById.clear();
    for (const c of this.countries()) {
      if (c.id != null) this.countryNameById.set(c.id, c.name ?? '');
    }

    this.cityNameById.clear();
    for (const c of this.cities()) {
      if (c.id != null) this.cityNameById.set(c.id, c.name ?? '');
    }
  }

  countryName(id?: number | null) {
    if (!id) return '-';
    return this.countryNameById.get(id) ?? '-';
  }

  cityName(id?: number | null) {
    if (!id) return '-';
    return this.cityNameById.get(id) ?? '-';
  }

  startCountryEdit(row: CountryDto) {
    if (!row.id) return;
    this.countryAlert.set(null);
    this.editingCountryId.set(row.id);
    this.countryEditForm.setValue({
      name: (row.name ?? '') as string,
      code: (row.code ?? '') as string,
    });
  }

  cancelCountryEdit() {
    this.editingCountryId.set(null);
  }

  createCountry() {
    if (this.countryCreateForm.invalid) {
      this.countryCreateForm.markAllAsTouched();
      return;
    }

    const v = this.countryCreateForm.getRawValue();
    const dto: CountryCreateDto = {
      name: v.name.trim() || null,
      code: v.code.trim() || null,
    };

    this.countriesApi.apiCountriesPost(dto).subscribe({
      next: () => {
        this.countryCreateForm.reset({ name: '', code: '' });
        this.countryAlert.set({ type: 'success', message: 'Stát vytvořen.' });
        this.loadAll();
      },
      error: () => {
        this.countryAlert.set({ type: 'danger', message: 'Nepodařilo se vytvořit stát.' });
      },
    });
  }

  saveCountry(id: number) {
    if (this.countryEditForm.invalid) {
      this.countryEditForm.markAllAsTouched();
      return;
    }

    const v = this.countryEditForm.getRawValue();
    const dto: CountryUpdateDto = {
      name: v.name.trim() || null,
      code: v.code.trim() || null,
    };

    this.countriesApi.apiCountriesIdPut(id, dto).subscribe({
      next: () => {
        this.countryAlert.set({ type: 'success', message: 'Stát upraven.' });
        this.editingCountryId.set(null);
        this.loadAll();
      },
      error: () => {
        this.countryAlert.set({ type: 'danger', message: 'Nepodařilo se upravit stát.' });
      },
    });
  }

  deleteCountry(id: number) {
    if (!confirm('Opravdu smazat stát?')) return;

    this.countriesApi.apiCountriesIdDelete(id).subscribe({
      next: () => {
        this.countryAlert.set({ type: 'success', message: 'Stát smazán.' });
        this.loadAll();
      },
      error: (err) => {
        this.countryAlert.set({ type: 'danger', message: this.usedDeleteMessage(err, 'Stát') });
      },
    });
  }

  startCityEdit(row: CityDto) {
    if (!row.id) return;
    this.cityAlert.set(null);
    this.editingCityId.set(row.id);
    this.cityEditForm.setValue({
      name: (row.name ?? '') as string,
      countryId: row.countryId ?? null,
    });
  }

  cancelCityEdit() {
    this.editingCityId.set(null);
  }

  createCity() {
    if (this.cityCreateForm.invalid) {
      this.cityCreateForm.markAllAsTouched();
      return;
    }

    const v = this.cityCreateForm.getRawValue();
    const dto: CityCreateDto = {
      name: v.name.trim() || null,
      countryId: v.countryId ?? null,
    };

    this.citiesApi.apiCitiesPost(dto).subscribe({
      next: () => {
        this.cityCreateForm.reset({ name: '', countryId: null });
        this.cityAlert.set({ type: 'success', message: 'Město vytvořeno.' });
        this.loadAll();
      },
      error: () => {
        this.cityAlert.set({ type: 'danger', message: 'Nepodařilo se vytvořit město.' });
      },
    });
  }

  saveCity(id: number) {
    if (this.cityEditForm.invalid) {
      this.cityEditForm.markAllAsTouched();
      return;
    }

    const v = this.cityEditForm.getRawValue();
    const dto: CityUpdateDto = {
      name: v.name.trim() || null,
      countryId: v.countryId ?? null,
    };

    this.citiesApi.apiCitiesIdPut(id, dto).subscribe({
      next: () => {
        this.cityAlert.set({ type: 'success', message: 'Město upraveno.' });
        this.editingCityId.set(null);
        this.loadAll();
      },
      error: () => {
        this.cityAlert.set({ type: 'danger', message: 'Nepodařilo se upravit město.' });
      },
    });
  }

  deleteCity(id: number) {
    if (!confirm('Opravdu smazat město?')) return;

    this.citiesApi.apiCitiesIdDelete(id).subscribe({
      next: () => {
        this.cityAlert.set({ type: 'success', message: 'Město smazáno.' });
        this.loadAll();
      },
      error: (err) => {
        this.cityAlert.set({ type: 'danger', message: this.usedDeleteMessage(err, 'Město') });
      },
    });
  }

  startAddressEdit(row: AddressDto) {
    if (!row.id) return;
    this.addressAlert.set(null);
    this.editingAddressId.set(row.id);
    this.addressEditForm.setValue({
      street: (row.street ?? '') as string,
      houseNumber: (row.houseNumber ?? '') as string,
      zipCode: (row.zipCode ?? '') as string,
      cityId: row.cityId ?? null,
      countryId: row.countryId ?? null,
    });
  }

  cancelAddressEdit() {
    this.editingAddressId.set(null);
  }

  createAddress() {
    if (this.addressCreateForm.invalid) {
      this.addressCreateForm.markAllAsTouched();
      return;
    }

    const v = this.addressCreateForm.getRawValue();
    const dto: AddressCreateDto = {
      street: v.street.trim() || null,
      houseNumber: v.houseNumber.trim() || null,
      zipCode: v.zipCode.trim() || null,
      cityId: v.cityId ?? null,
      countryId: v.countryId ?? null,
    };

    this.addressesApi.apiAddressesPost(dto).subscribe({
      next: () => {
        this.addressCreateForm.reset({ street: '', houseNumber: '', zipCode: '', cityId: null, countryId: null });
        this.addressAlert.set({ type: 'success', message: 'Adresa vytvořena.' });
        this.loadAll();
      },
      error: () => {
        this.addressAlert.set({ type: 'danger', message: 'Nepodařilo se vytvořit adresu.' });
      },
    });
  }

  saveAddress(id: number) {
    if (this.addressEditForm.invalid) {
      this.addressEditForm.markAllAsTouched();
      return;
    }

    const v = this.addressEditForm.getRawValue();
    const dto: AddressUpdateDto = {
      street: v.street.trim() || null,
      houseNumber: v.houseNumber.trim() || null,
      zipCode: v.zipCode.trim() || null,
      cityId: v.cityId ?? null,
      countryId: v.countryId ?? null,
    };

    this.addressesApi.apiAddressesIdPut(id, dto).subscribe({
      next: () => {
        this.addressAlert.set({ type: 'success', message: 'Adresa upravena.' });
        this.editingAddressId.set(null);
        this.loadAll();
      },
      error: () => {
        this.addressAlert.set({ type: 'danger', message: 'Nepodařilo se upravit adresu.' });
      },
    });
  }

  deleteAddress(id: number) {
    if (!confirm('Opravdu smazat adresu?')) return;

    this.addressesApi.apiAddressesIdDelete(id).subscribe({
      next: () => {
        this.addressAlert.set({ type: 'success', message: 'Adresa smazána.' });
        this.loadAll();
      },
      error: (err) => {
        this.addressAlert.set({ type: 'danger', message: this.usedDeleteMessage(err, 'Adresa') });
      },
    });
  }

  startJobCategoryEdit(row: JobCategoryDto) {
    if (!row.id) return;
    this.jobCategoryAlert.set(null);
    this.editingJobCategoryId.set(row.id);
    this.jobCategoryEditForm.setValue({
      name: (row.name ?? '') as string,
    });
  }

  cancelJobCategoryEdit() {
    this.editingJobCategoryId.set(null);
  }

  createJobCategory() {
    if (this.jobCategoryCreateForm.invalid) {
      this.jobCategoryCreateForm.markAllAsTouched();
      return;
    }

    const v = this.jobCategoryCreateForm.getRawValue();
    const dto: JobCategoryCreateDto = { name: v.name.trim() || null };

    this.jobCategoriesApi.apiJobCategoriesPost(dto).subscribe({
      next: () => {
        this.jobCategoryCreateForm.reset({ name: '' });
        this.jobCategoryAlert.set({ type: 'success', message: 'Pracovní pozice vytvořena.' });
        this.loadAll();
      },
      error: () => {
        this.jobCategoryAlert.set({ type: 'danger', message: 'Nepodařilo se vytvořit pracovní pozici.' });
      },
    });
  }

  saveJobCategory(id: number) {
    if (this.jobCategoryEditForm.invalid) {
      this.jobCategoryEditForm.markAllAsTouched();
      return;
    }

    const v = this.jobCategoryEditForm.getRawValue();
    const dto: JobCategoryUpdateDto = { name: v.name.trim() || null };

    this.jobCategoriesApi.apiJobCategoriesIdPut(id, dto).subscribe({
      next: () => {
        this.jobCategoryAlert.set({ type: 'success', message: 'Pracovní pozice upravena.' });
        this.editingJobCategoryId.set(null);
        this.loadAll();
      },
      error: () => {
        this.jobCategoryAlert.set({ type: 'danger', message: 'Nepodařilo se upravit pracovní pozici.' });
      },
    });
  }

  deleteJobCategory(id: number) {
    if (!confirm('Opravdu smazat pracovní pozici?')) return;

    this.jobCategoriesApi.apiJobCategoriesIdDelete(id).subscribe({
      next: () => {
        this.jobCategoryAlert.set({ type: 'success', message: 'Pracovní pozice smazána.' });
        this.loadAll();
      },
      error: (err) => {
        this.jobCategoryAlert.set({ type: 'danger', message: this.usedDeleteMessage(err, 'Pracovní pozice') });
      },
    });
  }

  private usedDeleteMessage(err: any, entityLabel: string): string {
    const raw =
      typeof err?.error === 'string'
        ? err.error
        : err?.error
          ? JSON.stringify(err.error)
          : '';

    const status = err?.status;
    const looksLikeFk = /foreign key|constraint|referenc|dependent|used|použit/i.test(raw);

    if (status === 409 || status === 400 || status === 500 || looksLikeFk) {
      return `${entityLabel} nelze smazat, protože je použit u některé položky.`;
    }

    return `${entityLabel} nelze smazat.`;
  }

  private cancelAllEdits() {
    this.editingCountryId.set(null);
    this.editingCityId.set(null);
    this.editingAddressId.set(null);
    this.editingJobCategoryId.set(null);
  }

  private clearAllAlerts() {
    this.countryAlert.set(null);
    this.cityAlert.set(null);
    this.addressAlert.set(null);
    this.jobCategoryAlert.set(null);
  }
}
