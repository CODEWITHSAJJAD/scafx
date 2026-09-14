# {{projectName}}

Production-ready ASP.NET Core 8 Web API scaffolded with [scafx](https://github.com/CODEWITHSAJJAD/scafx).

## Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### Run Locally

```bash
dotnet restore
dotnet run
```

API will be running at `http://localhost:{{port}}`.

### Available Endpoints

- `GET /` - Welcome and metadata
- `GET /health` - Health check endpoint
- `GET /api/info` - Service information
- `GET /swagger` - OpenAPI / Swagger interactive UI (in Development)

### Build and Publish

```bash
dotnet build
dotnet publish -c Release -o ./publish
```
