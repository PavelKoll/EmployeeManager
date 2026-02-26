namespace EmployeeManager.WebAPI.Data.Entities;

public class Salary
{
    public int Id { get; set; }

    public decimal Amount { get; set; }

    public DateTime From { get; set; }
    public DateTime? To { get; set; } 

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
}