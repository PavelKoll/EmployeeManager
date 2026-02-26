using EmployeeManager.WebAPI.Data;
using EmployeeManager.WebAPI.Data.Dtos.JobCategories;
using EmployeeManager.WebAPI.Data.Entities;
using EmployeeManager.WebAPI.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManager.WebAPI.Services.JobCategories;

public sealed class JobCategoryService : IJobCategoryService
{
    private readonly AppDbContext _db;

    public JobCategoryService(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<JobCategoryDto>> GetAllAsync(CancellationToken ct = default)
        => _db.JobCategories
            .AsNoTracking()
            .Select(j => new JobCategoryDto
            {
                Id = j.Id,
                Name = j.Name
            })
            .ToListAsync(ct);

    public async Task<JobCategoryDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var j = await _db.JobCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (j is null)
            throw new NotFoundException("JobCategory not found.");

        return new JobCategoryDto
        {
            Id = j.Id,
            Name = j.Name
        };
    }

    public async Task<JobCategoryDto> CreateAsync(JobCategoryCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BadRequestException("Name is required.");

        var name = dto.Name.Trim();

        var exists = await _db.JobCategories.AnyAsync(x => x.Name == name, ct);
        if (exists)
            throw new ConflictException("JobCategory with the same name already exists.");

        var jobCategory = new JobCategory { Name = name };

        _db.JobCategories.Add(jobCategory);
        await _db.SaveChangesAsync(ct);

        return new JobCategoryDto
        {
            Id = jobCategory.Id,
            Name = jobCategory.Name
        };
    }

    public async Task UpdateAsync(int id, JobCategoryUpdateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BadRequestException("Name is required.");

        var jobCategory = await _db.JobCategories.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (jobCategory is null)
            throw new NotFoundException("JobCategory not found.");

        var name = dto.Name.Trim();

        var exists = await _db.JobCategories.AnyAsync(x => x.Id != id && x.Name == name, ct);
        if (exists)
            throw new ConflictException("JobCategory with the same name already exists.");

        jobCategory.Name = name;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var jobCategory = await _db.JobCategories.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (jobCategory is null)
            throw new NotFoundException("JobCategory not found.");

        _db.JobCategories.Remove(jobCategory);
        await _db.SaveChangesAsync(ct);
    }
}
