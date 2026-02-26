using EmployeeManager.WebAPI.Data.Dtos.JobCategories;
using EmployeeManager.WebAPI.Services.JobCategories;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManager.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobCategoriesController : ControllerBase
{
    private readonly IJobCategoryService _service;

    public JobCategoriesController(IJobCategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<JobCategoryDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobCategoryDto>> GetById(int id)
    {
        return Ok(await _service.GetByIdAsync(id));
    }

    [HttpPost]
    public async Task<ActionResult<JobCategoryDto>> Create(JobCategoryCreateDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, JobCategoryUpdateDto dto)
    {
        await _service.UpdateAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}