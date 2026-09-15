namespace {{projectName}}.Repositories;

public record ItemRecord(int Id, string Title);

public interface IItemRepository
{
    IEnumerable<ItemRecord> GetAll();
}

public class InMemoryItemRepository : IItemRepository
{
    public IEnumerable<ItemRecord> GetAll() =>
        new[] { new ItemRecord(1, "{{projectName}} Item") };
}
