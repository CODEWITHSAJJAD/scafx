using Microsoft.AspNetCore.Mvc;
using {{projectName}}.Services;

namespace {{projectName}}.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly ItemService _service;

    public ItemsController(ItemService service)
    {
        _service = service;
    }

    [HttpGet]
    public IActionResult Get() => Ok(_service.GetItems());
}
