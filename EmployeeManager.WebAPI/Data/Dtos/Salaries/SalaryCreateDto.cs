namespace EmployeeManager.WebAPI.Data.Dtos.Salaries;

public class SalaryCreateDto
{
    public decimal Amount { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }

    public int EmployeeId { get; set; }
}