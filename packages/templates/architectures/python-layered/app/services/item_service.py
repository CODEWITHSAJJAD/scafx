from app.repositories.item_repository import item_repository

class ItemService:
    def list_items(self):
        return item_repository.get_all()

    def get_item(self, item_id: str):
        return item_repository.get_by_id(item_id)

item_service = ItemService()
