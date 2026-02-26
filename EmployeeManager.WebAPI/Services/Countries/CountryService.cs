using EmployeeManager.WebAPI.Data;
using EmployeeManager.WebAPI.Data.Dtos.Countries;
using EmployeeManager.WebAPI.Data.Entities;
using EmployeeManager.WebAPI.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManager.WebAPI.Services.Countries;

public sealed class CountryService : ICountryService
{
    private readonly AppDbContext _db;

    public CountryService(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<CountryDto>> GetAllAsync(CancellationToken ct = default)
        => _db.Countries
            .AsNoTracking()
            .Select(c => new CountryDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code
            })
            .ToListAsync(ct);

    public async Task<CountryDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var c = await _db.Countries
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (c is null)
            throw new NotFoundException("Country not found.");

        return new CountryDto
        {
            Id = c.Id,
            Name = c.Name,
            Code = c.Code
        };
    }

    public async Task<CountryDto> CreateAsync(CountryCreateDto dto, CancellationToken ct = default)
    {
        var (name, code) = NormalizeAndValidate(dto.Name, dto.Code);

        var codeExists = await _db.Countries.AnyAsync(x => x.Code == code, ct);
        if (codeExists)
            throw new ConflictException("Country with the same code already exists.");

        var country = new Country
        {
            Name = name,
            Code = code
        };

        _db.Countries.Add(country);
        await _db.SaveChangesAsync(ct);

        return new CountryDto
        {
            Id = country.Id,
            Name = country.Name,
            Code = country.Code
        };
    }

    public async Task UpdateAsync(int id, CountryUpdateDto dto, CancellationToken ct = default)
    {
        var country = await _db.Countries.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (country is null)
            throw new NotFoundException("Country not found.");

        var (name, code) = NormalizeAndValidate(dto.Name, dto.Code);

        var codeExists = await _db.Countries.AnyAsync(x => x.Id != id && x.Code == code, ct);
        if (codeExists)
            throw new ConflictException("Country with the same code already exists.");

        country.Name = name;
        country.Code = code;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var country = await _db.Countries.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (country is null)
            throw new NotFoundException("Country not found.");

        _db.Countries.Remove(country);
        await _db.SaveChangesAsync(ct);
    }

    private static (string Name, string Code) NormalizeAndValidate(string? nameRaw, string? codeRaw)
    {
        if (string.IsNullOrWhiteSpace(nameRaw))
            throw new BadRequestException("Name is required.");

        if (string.IsNullOrWhiteSpace(codeRaw))
            throw new BadRequestException("Code is required.");

        var name = nameRaw.Trim();
        var code = codeRaw.Trim().ToUpperInvariant();

        if (code.Length is < 2 or > 3)
            throw new BadRequestException("Code must be 2-3 characters long.");

        return (name, code);
    }
}
