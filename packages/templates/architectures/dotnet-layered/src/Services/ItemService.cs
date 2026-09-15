using {{projectName}}.Repositories;

namespace {{projectName}}.Services;

public class ItemService
{
    private readonly IItemRepository _repository;

    public ItemService(IItemRepository repository)
    {
        _repository = repository;
    }

    public IEnumerable<ItemRecord> GetItems() => _repository.GetAll();
}
