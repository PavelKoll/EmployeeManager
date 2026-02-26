using EmployeeManager.WebAPI.Data.Dtos.Countries;

namespace EmployeeManager.WebAPI.Services.Countries;

public interface ICountryService
{
    Task<List<CountryDto>> GetAllAsync(CancellationToken ct = default);
    Task<CountryDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CountryDto> CreateAsync(CountryCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, CountryUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
