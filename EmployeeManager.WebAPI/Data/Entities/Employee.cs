using EmployeeManager.WebAPI.Data.Enums;
namespace EmployeeManager.WebAPI.Data.Entities;

public class Employee
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }

    public DateTime BirthDate { get; set; }
    public Gender Gender { get; set; }

    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public DateTime JoinedDate { get; set; }
    public DateTime? ExitedDate { get; set; }

    public int? SuperiorId { get; set; }
    public Employee? Superior { get; set; }

    public List<Employee> Subordinates { get; set; } = new();

    public int? AddressId { get; set; }
    public Address? Address { get; set; }

    public List<Salary> Salaries { get; set; } = new();
    public List<EmployeeJobCategory> EmployeeJobCategories { get; set; } = new();
}