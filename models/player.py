class Player:
    def __init__(self, name):
        self.name = name
        self.is_owner = False

    def is_owner(self):
        return self.is_owner

    def set_owner(self, owner):
        self.is_owner = owner