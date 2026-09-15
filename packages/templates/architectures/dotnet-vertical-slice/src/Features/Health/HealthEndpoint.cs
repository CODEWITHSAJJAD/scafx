namespace {{projectName}}.Features.Health;

public record HealthResponse(string Status, string Service, DateTime Timestamp);

public static class HealthEndpoint
{
    public static IEndpointRouteBuilder MapHealthFeature(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/health", () => Results.Ok(new HealthResponse("Healthy", "{{projectName}}", DateTime.UtcNow)))
            .WithTags("Health");
        return endpoints;
    }
}
