using Microsoft.AspNetCore.Mvc;

namespace {{projectName}}.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceDiscoveryController : ControllerBase
{
    private readonly ILogger<ServiceDiscoveryController> _logger;

    public ServiceDiscoveryController(ILogger<ServiceDiscoveryController> logger)
    {
        _logger = logger;
    }

    [HttpGet("info")]
    public IActionResult GetServiceInfo()
    {
        return Ok(new
        {
            Service = "{{projectName}}",
            Status = "Healthy",
            Version = "1.0.0",
            Timestamp = DateTime.UtcNow
        });
    }
}
