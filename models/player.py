class Player:
    def __init__(self, name):
        self.name = name
        self.socket_id = None
        self._is_owner = False

    def is_owner(self):
        return self._is_owner

    def set_owner(self, owner):
        self._is_owner = owner

    def set_socket_id(self, socket_id):
        self.socket_id = socket_id

    def get_socket_id(self):
        return self.socket_id