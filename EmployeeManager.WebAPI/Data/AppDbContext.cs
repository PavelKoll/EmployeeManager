using Microsoft.EntityFrameworkCore;
using EmployeeManager.WebAPI.Data.Entities;

namespace EmployeeManager.WebAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<Country> Countries => Set<Country>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<JobCategory> JobCategories => Set<JobCategory>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Salary> Salaries => Set<Salary>();

    public DbSet<EmployeeJobCategory> EmployeeJobCategories => Set<EmployeeJobCategory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>()
            .HasIndex(e => e.Email)
            .IsUnique();

        modelBuilder.Entity<Employee>()
            .Property(e => e.Email)
            .HasMaxLength(256);

        modelBuilder.Entity<Address>()
            .HasOne(a => a.City)
            .WithMany()
            .HasForeignKey(a => a.CityId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Address)
            .WithMany()
            .HasForeignKey(e => e.AddressId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Salary>()
            .Property(s => s.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Salary>()
            .HasOne(s => s.Employee)
            .WithMany(e => e.Salaries)
            .HasForeignKey(s => s.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Salary>()
            .HasCheckConstraint("CK_Salary_FromTo", "\"To\" IS NULL OR \"To\" >= \"From\"");

        modelBuilder.Entity<Salary>()
            .HasIndex(s => new { s.EmployeeId, s.From });

        modelBuilder.Entity<City>()
            .HasOne(c => c.Country)
            .WithMany()
            .HasForeignKey(c => c.CountryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<City>()
            .HasIndex(c => new { c.CountryId, c.Name });

        modelBuilder.Entity<EmployeeJobCategory>()
            .HasKey(x => new { x.EmployeeId, x.JobCategoryId });

        modelBuilder.Entity<EmployeeJobCategory>()
            .HasOne(x => x.Employee)
            .WithMany(e => e.EmployeeJobCategories)
            .HasForeignKey(x => x.EmployeeId);

        modelBuilder.Entity<EmployeeJobCategory>()
            .HasOne(x => x.JobCategory)
            .WithMany()
            .HasForeignKey(x => x.JobCategoryId);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Superior)
            .WithMany(e => e.Subordinates)
            .HasForeignKey(e => e.SuperiorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}