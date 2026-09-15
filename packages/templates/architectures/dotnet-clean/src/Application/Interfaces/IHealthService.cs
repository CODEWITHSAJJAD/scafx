using {{projectName}}.Domain.Entities;

namespace {{projectName}}.Application.Interfaces;

public interface IHealthService
{
    HealthStatus GetHealth();
}
