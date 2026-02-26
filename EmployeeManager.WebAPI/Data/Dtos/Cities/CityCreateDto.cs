namespace EmployeeManager.WebAPI.Data.Dtos.Cities;

public class CityCreateDto
{
    public string Name { get; set; } = string.Empty;
    public int? CountryId { get; set; }
}