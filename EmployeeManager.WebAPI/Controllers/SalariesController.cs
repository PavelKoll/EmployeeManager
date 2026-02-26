using EmployeeManager.WebAPI.Data.Dtos.Salaries;
using EmployeeManager.WebAPI.Services.Salaries;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManager.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalariesController : ControllerBase
{
    private readonly ISalaryService _service;

    public SalariesController(ISalaryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<SalaryDto>>> GetAll([FromQuery] int? employeeId)
    {
        return Ok(await _service.GetAllAsync(employeeId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SalaryDto>> GetById(int id)
    {
        return Ok(await _service.GetByIdAsync(id));
    }

    [HttpPost]
    public async Task<ActionResult<SalaryDto>> Create(SalaryCreateDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, SalaryUpdateDto dto)
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