from typing import List, Dict, Optional

class ItemRepository:
    def __init__(self):
        self._items: List[Dict] = [
            {"id": "1", "name": "Initial Resource", "service": "{{projectName}}"}
        ]

    def get_all(self) -> List[Dict]:
        return self._items

    def get_by_id(self, item_id: str) -> Optional[Dict]:
        return next((i for i in self._items if i["id"] == item_id), None)

item_repository = ItemRepository()
