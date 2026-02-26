using System.Net.Mail;
using EmployeeManager.WebAPI.Data;
using EmployeeManager.WebAPI.Data.Dtos.Employees;
using EmployeeManager.WebAPI.Data.Entities;
using EmployeeManager.WebAPI.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManager.WebAPI.Services.Employees;

public sealed class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _db;

    public EmployeeService(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<EmployeeDto>> GetAllAsync(CancellationToken ct = default)
        => _db.Employees
            .AsNoTracking()
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                FirstName = e.FirstName,
                LastName = e.LastName,
                MiddleName = e.MiddleName,
                BirthDate = e.BirthDate,
                Email = e.Email,
                PhoneNumber = e.PhoneNumber,
                Gender = e.Gender,
                JoinedDate = e.JoinedDate,
                ExitedDate = e.ExitedDate,
                SuperiorId = e.SuperiorId,
                AddressId = e.AddressId,
                JobCategoryIds = e.EmployeeJobCategories.Select(x => x.JobCategoryId).ToList(),
                SalaryIds = e.Salaries.Select(s => s.Id).ToList()
            })
            .ToListAsync(ct);

    public async Task<EmployeeDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var dto = await _db.Employees
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                FirstName = e.FirstName,
                LastName = e.LastName,
                MiddleName = e.MiddleName,
                BirthDate = e.BirthDate,
                Email = e.Email,
                PhoneNumber = e.PhoneNumber,
                Gender = e.Gender,
                JoinedDate = e.JoinedDate,
                ExitedDate = e.ExitedDate,
                SuperiorId = e.SuperiorId,
                AddressId = e.AddressId,
                JobCategoryIds = e.EmployeeJobCategories.Select(x => x.JobCategoryId).ToList(),
                SalaryIds = e.Salaries.Select(s => s.Id).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (dto is null)
            throw new NotFoundException("Employee not found.");

        dto.SubordinateIds = await _db.Employees
            .AsNoTracking()
            .Where(x => x.SuperiorId == id)
            .Select(x => x.Id)
            .ToListAsync(ct);

        return dto;
    }

    public async Task<EmployeeDto> CreateAsync(EmployeeCreateDto dto, CancellationToken ct = default)
    {
        await ValidateEmployeeAsync(
            employeeId: null,
            firstName: dto.FirstName,
            lastName: dto.LastName,
            email: dto.Email,
            phoneNumber: dto.PhoneNumber,
            joinedDate: dto.JoinedDate,
            exitedDate: null,
            superiorId: dto.SuperiorId,
            addressId: dto.AddressId,
            jobCategoryIds: dto.JobCategoryIds,
            ct);

        var desiredCategoryIds = NormalizeIds(dto.JobCategoryIds);

        var employee = new Employee
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            MiddleName = NormalizeOptional(dto.MiddleName),
            BirthDate = dto.BirthDate,
            Email = dto.Email.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Gender = dto.Gender,
            JoinedDate = dto.JoinedDate,
            SuperiorId = dto.SuperiorId,
            AddressId = dto.AddressId
        };

        foreach (var catId in desiredCategoryIds)
        {
            employee.EmployeeJobCategories.Add(new EmployeeJobCategory
            {
                JobCategoryId = catId,
                Employee = employee
            });
        }

        _db.Employees.Add(employee);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("Employee with the same Email already exists.");
        }

        return new EmployeeDto
        {
            Id = employee.Id,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            MiddleName = employee.MiddleName,
            BirthDate = employee.BirthDate,
            Email = employee.Email,
            PhoneNumber = employee.PhoneNumber,
            Gender = employee.Gender,
            JoinedDate = employee.JoinedDate,
            ExitedDate = employee.ExitedDate,
            SuperiorId = employee.SuperiorId,
            AddressId = employee.AddressId,
            JobCategoryIds = desiredCategoryIds,
            SalaryIds = new List<int>()
        };
    }

    public async Task UpdateAsync(int id, EmployeeUpdateDto dto, CancellationToken ct = default)
    {
        var employee = await _db.Employees
            .Include(e => e.EmployeeJobCategories)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        if (employee is null)
            throw new NotFoundException("Employee not found.");

        await ValidateEmployeeAsync(
            employeeId: id,
            firstName: dto.FirstName,
            lastName: dto.LastName,
            email: dto.Email,
            phoneNumber: dto.PhoneNumber,
            joinedDate: dto.JoinedDate,
            exitedDate: dto.ExitedDate,
            superiorId: dto.SuperiorId,
            addressId: dto.AddressId,
            jobCategoryIds: dto.JobCategoryIds,
            ct);

        employee.FirstName = dto.FirstName.Trim();
        employee.LastName = dto.LastName.Trim();
        employee.MiddleName = NormalizeOptional(dto.MiddleName);
        employee.BirthDate = dto.BirthDate;
        employee.Email = dto.Email.Trim();
        employee.PhoneNumber = dto.PhoneNumber.Trim();
        employee.Gender = dto.Gender;
        employee.JoinedDate = dto.JoinedDate;
        employee.ExitedDate = dto.ExitedDate;
        employee.SuperiorId = dto.SuperiorId;
        employee.AddressId = dto.AddressId;

        SyncJobCategories(employee, NormalizeIds(dto.JobCategoryIds));

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("Employee with the same Email already exists.");
        }
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (employee is null)
            throw new NotFoundException("Employee not found.");

        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync(ct);
    }

    private static List<int> NormalizeIds(IEnumerable<int>? ids)
        => (ids ?? Array.Empty<int>()).Distinct().ToList();

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void SyncJobCategories(Employee employee, List<int> desiredIds)
    {
        var desired = desiredIds.ToHashSet();
        var current = employee.EmployeeJobCategories.Select(x => x.JobCategoryId).ToHashSet();

        var toRemove = employee.EmployeeJobCategories
            .Where(x => !desired.Contains(x.JobCategoryId))
            .ToList();

        foreach (var link in toRemove)
            employee.EmployeeJobCategories.Remove(link);

        foreach (var catId in desired)
        {
            if (!current.Contains(catId))
            {
                employee.EmployeeJobCategories.Add(new EmployeeJobCategory
                {
                    EmployeeId = employee.Id,
                    JobCategoryId = catId
                });
            }
        }
    }

    private async Task ValidateEmployeeAsync(
        int? employeeId,
        string? firstName,
        string? lastName,
        string? email,
        string? phoneNumber,
        DateTime joinedDate,
        DateTime? exitedDate,
        int? superiorId,
        int? addressId,
        List<int>? jobCategoryIds,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            throw new BadRequestException("FirstName and LastName are required.");

        if (joinedDate == default)
            throw new BadRequestException("JoinedDate is required.");

        if (exitedDate.HasValue && exitedDate.Value < joinedDate)
            throw new BadRequestException("ExitedDate must be greater than or equal to JoinedDate.");

        if (string.IsNullOrWhiteSpace(email))
            throw new BadRequestException("Valid Email is required.");

        try
        {
            _ = new MailAddress(email.Trim());
        }
        catch
        {
            throw new BadRequestException("Valid Email is required.");
        }

        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new BadRequestException("PhoneNumber is required.");

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var emailExists = await _db.Employees
            .AsNoTracking()
            .AnyAsync(
                e => e.Email.ToLower() == normalizedEmail && (!employeeId.HasValue || e.Id != employeeId.Value),
                ct);

        if (emailExists)
            throw new ConflictException("Employee with the same Email already exists.");

        if (superiorId.HasValue)
        {
            if (employeeId.HasValue && superiorId.Value == employeeId.Value)
                throw new BadRequestException("SuperiorId cannot be the same as Employee Id.");

            var superiorExists = await _db.Employees
                .AsNoTracking()
                .AnyAsync(e => e.Id == superiorId.Value, ct);

            if (!superiorExists)
                throw new BadRequestException("SuperiorId does not exist.");
        }

        if (addressId.HasValue)
        {
            var addressExists = await _db.Addresses
                .AsNoTracking()
                .AnyAsync(a => a.Id == addressId.Value, ct);

            if (!addressExists)
                throw new BadRequestException("AddressId does not exist.");
        }

        var desiredJobCategoryIds = NormalizeIds(jobCategoryIds);
        if (desiredJobCategoryIds.Count > 0)
        {
            var existingCount = await _db.JobCategories
                .AsNoTracking()
                .CountAsync(j => desiredJobCategoryIds.Contains(j.Id), ct);

            if (existingCount != desiredJobCategoryIds.Count)
                throw new BadRequestException("Some JobCategoryIds do not exist.");
        }
    }
}
