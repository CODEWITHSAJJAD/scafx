var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Root welcome route
app.MapGet("/", () => Results.Ok(new
{
    message = "Welcome to {{projectName}}!",
    stack = "dotnet",
    framework = "webapi",
    version = "1.0.0"
}));

// Health check route
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    timestamp = DateTime.UtcNow
}));

// API info endpoint
app.MapGet("/api/info", () => Results.Ok(new
{
    name = "{{projectName}}",
    version = "1.0.0",
    framework = "ASP.NET Core 8 Web API",
    runtime = Environment.Version.ToString()
}));

app.Run();
