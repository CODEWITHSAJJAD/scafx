using Microsoft.AspNetCore.Mvc;

namespace {{projectName}}.Modules.Users;

[ApiController]
[Route("api/users")]
public class UsersModuleController : ControllerBase
{
    [HttpGet]
    public IActionResult GetUsers()
    {
        return Ok(new[] { new { Id = 1, Username = "admin" } });
    }
}
