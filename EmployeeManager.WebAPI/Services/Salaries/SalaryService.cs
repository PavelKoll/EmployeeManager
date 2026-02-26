using EmployeeManager.WebAPI.Data;
using EmployeeManager.WebAPI.Data.Dtos.Salaries;
using EmployeeManager.WebAPI.Data.Entities;
using EmployeeManager.WebAPI.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManager.WebAPI.Services.Salaries;

public sealed class SalaryService : ISalaryService
{
    private readonly AppDbContext _db;

    public SalaryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SalaryDto>> GetAllAsync(int? employeeId, CancellationToken ct = default)
    {
        var query = _db.Salaries.AsNoTracking().AsQueryable();
        if (employeeId.HasValue)
            query = query.Where(s => s.EmployeeId == employeeId.Value);

        return await query
            .OrderByDescending(s => s.From)
            .Select(s => new SalaryDto
            {
                Id = s.Id,
                Amount = s.Amount,
                From = s.From,
                To = s.To,
                EmployeeId = s.EmployeeId
            })
            .ToListAsync(ct);
    }

    public async Task<SalaryDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var s = await _db.Salaries
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (s is null)
            throw new NotFoundException("Salary not found.");

        return new SalaryDto
        {
            Id = s.Id,
            Amount = s.Amount,
            From = s.From,
            To = s.To,
            EmployeeId = s.EmployeeId
        };
    }

    public async Task<SalaryDto> CreateAsync(SalaryCreateDto dto, CancellationToken ct = default)
    {
        var from = dto.From ?? DateTime.UtcNow;
        var to = dto.To;

        ValidateBasic(dto.EmployeeId, dto.Amount, from, to);
        await EnsureEmployeeExistsAsync(dto.EmployeeId, ct);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var current = await _db.Salaries
            .Where(s => s.EmployeeId == dto.EmployeeId && s.To == null)
            .OrderByDescending(s => s.From)
            .FirstOrDefaultAsync(ct);

        if (current is not null)
        {
            if (from <= current.From)
                throw new BadRequestException("New salary 'From' must be after the current salary 'From'.");

            current.To = from.AddTicks(-1);
            await _db.SaveChangesAsync(ct);
        }

        var overlapError = await ValidateOverlapAsync(dto.EmployeeId, from, to, ignoreSalaryId: null, ct);
        if (overlapError is not null)
            throw new BadRequestException(overlapError);

        var salary = new Salary
        {
            EmployeeId = dto.EmployeeId,
            Amount = dto.Amount,
            From = from,
            To = to
        };

        _db.Salaries.Add(salary);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return new SalaryDto
        {
            Id = salary.Id,
            EmployeeId = salary.EmployeeId,
            Amount = salary.Amount,
            From = salary.From,
            To = salary.To
        };
    }

    public async Task UpdateAsync(int id, SalaryUpdateDto dto, CancellationToken ct = default)
    {
        var salary = await _db.Salaries.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (salary is null)
            throw new NotFoundException("Salary not found.");

        var from = dto.From ?? DateTime.UtcNow;
        var to = dto.To;

        ValidateBasic(dto.EmployeeId, dto.Amount, from, to);
        await EnsureEmployeeExistsAsync(dto.EmployeeId, ct);

        var overlapError = await ValidateOverlapAsync(dto.EmployeeId, from, to, ignoreSalaryId: id, ct);
        if (overlapError is not null)
            throw new BadRequestException(overlapError);

        salary.EmployeeId = dto.EmployeeId;
        salary.Amount = dto.Amount;
        salary.From = from;
        salary.To = to;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var salary = await _db.Salaries.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (salary is null)
            throw new NotFoundException("Salary not found.");

        _db.Salaries.Remove(salary);
        await _db.SaveChangesAsync(ct);
    }

    private static void ValidateBasic(int employeeId, decimal amount, DateTime from, DateTime? to)
    {
        if (employeeId <= 0)
            throw new BadRequestException("EmployeeId is required.");

        if (amount <= 0)
            throw new BadRequestException("Amount must be greater than 0.");

        if (to.HasValue && to.Value < from)
            throw new BadRequestException("To must be greater than or equal to From.");
    }

    private async Task EnsureEmployeeExistsAsync(int employeeId, CancellationToken ct)
    {
        var exists = await _db.Employees.AnyAsync(e => e.Id == employeeId, ct);
        if (!exists)
            throw new BadRequestException("EmployeeId does not exist.");
    }

    private async Task<string?> ValidateOverlapAsync(
        int employeeId,
        DateTime from,
        DateTime? to,
        int? ignoreSalaryId,
        CancellationToken ct)
    {
        var overlaps = await _db.Salaries
            .AsNoTracking()
            .Where(s => s.EmployeeId == employeeId)
            .Where(s => !ignoreSalaryId.HasValue || s.Id != ignoreSalaryId.Value)
            .AnyAsync(
                s => (!s.To.HasValue || s.To.Value >= from) && (!to.HasValue || s.From <= to.Value),
                ct);

        return overlaps
            ? "Salary interval overlaps with an existing salary for this employee."
            : null;
    }
}
