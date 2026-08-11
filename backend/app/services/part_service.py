from app.repositories.part_repository import PartRepository


class PartService:

    def __init__(self, db):
        self.repository = PartRepository(db)

    def get_active_parts(self):
        return self.repository.get_active_parts()

    def get_part(self, part_id: int):
        return self.repository.get_by_id(part_id)