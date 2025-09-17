from models.player import Player

class Game:
    def __init__(self, code: str):
        self.code = code
        self.players = []

    def add_player(self, player: Player):
        if self.is_unique(player):
            self.players.append(player)
            return True
        return False

    def get_code(self):
        return self.code

    def is_unique(self, player: Player):
        if any(p.name.lower() == player.name.lower() for p in self.players):
            return False
        return True

    def get_player_names(self):
        return [player.name for player in self.players]