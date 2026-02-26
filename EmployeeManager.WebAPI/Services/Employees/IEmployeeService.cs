using EmployeeManager.WebAPI.Data.Dtos.Employees;

namespace EmployeeManager.WebAPI.Services.Employees;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetAllAsync(CancellationToken ct = default);
    Task<EmployeeDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<EmployeeDto> CreateAsync(EmployeeCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, EmployeeUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
