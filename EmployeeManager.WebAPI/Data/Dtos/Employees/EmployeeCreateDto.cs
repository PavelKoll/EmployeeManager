using EmployeeManager.WebAPI.Data.Enums;

namespace EmployeeManager.WebAPI.Data.Dtos.Employees;

public class EmployeeCreateDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }

    public DateTime BirthDate { get; set; }
    public Gender Gender { get; set; }

    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public DateTime JoinedDate { get; set; }

    public int? SuperiorId { get; set; }
    public int? AddressId { get; set; }

    public List<int> JobCategoryIds { get; set; } = new();
}