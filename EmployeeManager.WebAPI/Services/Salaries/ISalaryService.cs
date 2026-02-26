using EmployeeManager.WebAPI.Data.Dtos.Salaries;

namespace EmployeeManager.WebAPI.Services.Salaries;

public interface ISalaryService
{
    Task<List<SalaryDto>> GetAllAsync(int? employeeId, CancellationToken ct = default);
    Task<SalaryDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<SalaryDto> CreateAsync(SalaryCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, SalaryUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
