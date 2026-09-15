using System.Data;
using Microsoft.Data.SqlClient;

namespace {{projectName}}.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=localhost;Database=app_db;User Id=sa;Password=password;TrustServerCertificate=True;";
    }

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
