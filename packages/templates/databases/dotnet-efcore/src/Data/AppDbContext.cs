using Microsoft.EntityFrameworkCore;
using {{projectName}}.Models;

namespace {{projectName}}.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ItemEntity> Items => Set<ItemEntity>();
}
