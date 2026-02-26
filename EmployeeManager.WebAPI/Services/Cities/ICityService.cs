using EmployeeManager.WebAPI.Data.Dtos.Cities;

namespace EmployeeManager.WebAPI.Services.Cities;

public interface ICityService
{
    Task<List<CityDto>> GetAllAsync(CancellationToken ct = default);
    Task<CityDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<CityDto>> GetAllByCountryAsync(int countryId, CancellationToken ct = default);
    Task<CityDto> CreateAsync(CityCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, CityUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
