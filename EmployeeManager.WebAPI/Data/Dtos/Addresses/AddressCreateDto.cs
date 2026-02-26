namespace EmployeeManager.WebAPI.Data.Dtos.Addresses;

public class AddressCreateDto
{
    public string Street { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public int? CityId { get; set; }
    public int? CountryId { get; set; }
}