namespace EmployeeManager.WebAPI.Data.Dtos.Cities;

public class CityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? CountryId { get; set; }
}