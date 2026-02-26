namespace EmployeeManager.WebAPI.Data.Entities;

public class Address
{
    public int Id { get; set; }

    public string Street { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;

    public int? CityId { get; set; }
    public City? City { get; set; }

    public int? CountryId { get; set; }
    public Country? Country { get; set; }
}