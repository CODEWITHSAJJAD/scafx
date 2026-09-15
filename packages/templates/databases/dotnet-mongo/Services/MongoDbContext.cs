using MongoDB.Driver;

namespace {{projectName}}.Services;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoConnection") ?? "mongodb://localhost:27017";
        var mongoUrl = MongoUrl.Create(connectionString);
        var client = new MongoClient(mongoUrl);
        _database = client.GetDatabase(mongoUrl.DatabaseName ?? "{{projectName}}_db");
    }

    public IMongoCollection<T> GetCollection<T>(string name) => _database.GetCollection<T>(name);
}
