class Player:
    def __init__(self, name):
        self.name = name
        self._is_owner = False

    def is_owner(self):
        return self._is_owner

    def set_owner(self, owner):
        self._is_owner = owner