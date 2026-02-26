namespace EmployeeManager.WebAPI.Data.Entities;

public class EmployeeJobCategory
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int JobCategoryId { get; set; }
    public JobCategory? JobCategory { get; set; }
}