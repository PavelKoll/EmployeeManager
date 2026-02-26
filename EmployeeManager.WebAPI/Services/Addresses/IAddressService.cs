using EmployeeManager.WebAPI.Data.Dtos.Addresses;

namespace EmployeeManager.WebAPI.Services.Addresses;

public interface IAddressService
{
    Task<List<AddressDto>> GetAllAsync(CancellationToken ct = default);
    Task<AddressDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AddressDto> CreateAsync(AddressCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, AddressUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
