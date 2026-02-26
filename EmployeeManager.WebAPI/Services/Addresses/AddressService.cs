using EmployeeManager.WebAPI.Data;
using EmployeeManager.WebAPI.Data.Dtos.Addresses;
using EmployeeManager.WebAPI.Data.Entities;
using EmployeeManager.WebAPI.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManager.WebAPI.Services.Addresses;

public sealed class AddressService : IAddressService
{
    private readonly AppDbContext _db;

    public AddressService(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<AddressDto>> GetAllAsync(CancellationToken ct = default)
        => _db.Addresses
            .AsNoTracking()
            .Select(a => new AddressDto
            {
                Id = a.Id,
                Street = a.Street,
                HouseNumber = a.HouseNumber,
                ZipCode = a.ZipCode,
                CityId = a.CityId,
                CountryId = a.CountryId
            })
            .ToListAsync(ct);

    public async Task<AddressDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var a = await _db.Addresses
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (a is null)
            throw new NotFoundException("Address not found.");

        return new AddressDto
        {
            Id = a.Id,
            Street = a.Street,
            HouseNumber = a.HouseNumber,
            ZipCode = a.ZipCode,
            CityId = a.CityId,
            CountryId = a.CountryId
        };
    }

    public async Task<AddressDto> CreateAsync(AddressCreateDto dto, CancellationToken ct = default)
    {
        ValidateRequired(dto.Street, dto.HouseNumber, dto.ZipCode);
        await EnsureCityExistsAsync(dto.CityId, ct);

        var address = new Address
        {
            Street = dto.Street.Trim(),
            HouseNumber = dto.HouseNumber.Trim(),
            ZipCode = dto.ZipCode.Trim(),
            CityId = dto.CityId,
            CountryId = dto.CountryId
        };

        _db.Addresses.Add(address);
        await _db.SaveChangesAsync(ct);

        return new AddressDto
        {
            Id = address.Id,
            Street = address.Street,
            HouseNumber = address.HouseNumber,
            ZipCode = address.ZipCode,
            CityId = address.CityId,
            CountryId = address.CountryId
        };
    }

    public async Task UpdateAsync(int id, AddressUpdateDto dto, CancellationToken ct = default)
    {
        ValidateRequired(dto.Street, dto.HouseNumber, dto.ZipCode);
        await EnsureCityExistsAsync(dto.CityId, ct);

        var address = await _db.Addresses.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (address is null)
            throw new NotFoundException("Address not found.");

        address.Street = dto.Street.Trim();
        address.HouseNumber = dto.HouseNumber.Trim();
        address.ZipCode = dto.ZipCode.Trim();
        address.CityId = dto.CityId;
        address.CountryId = dto.CountryId;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var address = await _db.Addresses.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (address is null)
            throw new NotFoundException("Address not found.");

        _db.Addresses.Remove(address);
        await _db.SaveChangesAsync(ct);
    }

    private static void ValidateRequired(string? street, string? houseNumber, string? zipCode)
    {
        if (string.IsNullOrWhiteSpace(street) || string.IsNullOrWhiteSpace(houseNumber))
            throw new BadRequestException("Street and HouseNumber are required.");

        if (string.IsNullOrWhiteSpace(zipCode))
            throw new BadRequestException("ZipCode is required.");
    }

    private async Task EnsureCityExistsAsync(int? cityId, CancellationToken ct)
    {
        if (!cityId.HasValue)
            return;

        var exists = await _db.Cities.AnyAsync(c => c.Id == cityId.Value, ct);
        if (!exists)
            throw new BadRequestException("CityId does not exist.");
    }
}
