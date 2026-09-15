var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Minimal API Routes
var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new
{
    Status = "Healthy",
    Application = "{{projectName}}",
    Timestamp = DateTime.UtcNow
})).WithTags("Health");

api.MapGet("/version", () => Results.Ok(new
{
    Version = "1.0.0",
    Framework = ".NET 8 Minimal API"
})).WithTags("System");

app.Run();
