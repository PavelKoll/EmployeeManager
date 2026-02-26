using EmployeeManager.WebAPI.Data.Dtos.JobCategories;

namespace EmployeeManager.WebAPI.Services.JobCategories;

public interface IJobCategoryService
{
    Task<List<JobCategoryDto>> GetAllAsync(CancellationToken ct = default);
    Task<JobCategoryDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<JobCategoryDto> CreateAsync(JobCategoryCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, JobCategoryUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
