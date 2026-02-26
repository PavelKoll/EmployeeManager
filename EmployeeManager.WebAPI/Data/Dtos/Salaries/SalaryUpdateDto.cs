namespace EmployeeManager.WebAPI.Data.Dtos.Salaries;

public class SalaryUpdateDto
{
    public decimal Amount { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }

    public int EmployeeId { get; set; }
}