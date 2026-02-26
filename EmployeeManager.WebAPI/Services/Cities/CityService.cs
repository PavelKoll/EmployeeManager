using EmployeeManager.WebAPI.Data;
using EmployeeManager.WebAPI.Data.Dtos.Cities;
using EmployeeManager.WebAPI.Data.Entities;
using EmployeeManager.WebAPI.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManager.WebAPI.Services.Cities;

public sealed class CityService : ICityService
{
    private readonly AppDbContext _db;

    public CityService(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<CityDto>> GetAllAsync(CancellationToken ct = default)
        => _db.Cities
            .AsNoTracking()
            .Select(c => new CityDto
            {
                Id = c.Id,
                Name = c.Name,
                CountryId = c.CountryId
            })
            .ToListAsync(ct);

    public async Task<CityDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var c = await _db.Cities
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (c is null)
            throw new NotFoundException("City not found.");

        return new CityDto
        {
            Id = c.Id,
            Name = c.Name,
            CountryId = c.CountryId
        };
    }

    public Task<List<CityDto>> GetAllByCountryAsync(int countryId, CancellationToken ct = default)
        => _db.Cities
            .AsNoTracking()
            .Where(c => c.CountryId == countryId)
            .OrderBy(c => c.Name)
            .Select(c => new CityDto
            {
                Id = c.Id,
                Name = c.Name,
                CountryId = c.CountryId
            })
            .ToListAsync(ct);

    public async Task<CityDto> CreateAsync(CityCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BadRequestException("Name is required.");

        await EnsureCountryExistsAsync(dto.CountryId, ct);

        var city = new City
        {
            Name = dto.Name.Trim(),
            CountryId = dto.CountryId
        };

        _db.Cities.Add(city);
        await _db.SaveChangesAsync(ct);

        return new CityDto
        {
            Id = city.Id,
            Name = city.Name,
            CountryId = city.CountryId
        };
    }

    public async Task UpdateAsync(int id, CityUpdateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BadRequestException("Name is required.");

        await EnsureCountryExistsAsync(dto.CountryId, ct);

        var city = await _db.Cities.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (city is null)
            throw new NotFoundException("City not found.");

        city.Name = dto.Name.Trim();
        city.CountryId = dto.CountryId;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var city = await _db.Cities.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (city is null)
            throw new NotFoundException("City not found.");

        _db.Cities.Remove(city);
        await _db.SaveChangesAsync(ct);
    }

    private async Task EnsureCountryExistsAsync(int? countryId, CancellationToken ct)
    {
        if (!countryId.HasValue)
            return;

        var exists = await _db.Countries.AnyAsync(x => x.Id == countryId.Value, ct);
        if (!exists)
            throw new BadRequestException("CountryId does not exist.");
    }
}
