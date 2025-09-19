from models.player import Player
from models.constants import locations_occupations

class Game:
    def __init__(self, code: str):
        self.code = code
        self.players = []
        self.game_duration = 480 # default - 8 minute games
        self.num_spies = 1
        self.locations_played = []

    def add_player(self, player: Player):
        if self.is_unique(player):
            self.players.append(player)
            return True
        return False

    def get_player(self, name):
        for player in self.players:
            if player.name == name:
                return player
        return None

    def get_locations(self):
        all_locations = locations_occupations.keys()
        return [location for location in all_locations if location not in self.locations_played]

    def get_code(self):
        return self.code

    def is_unique(self, player: Player):
        if any(p.name.lower() == player.name.lower() for p in self.players):
            return False
        return True

    def get_player_names(self):
        return [player.name for player in self.players]

    def set_game_duration(self, duration):
        self.game_duration = duration

    def set_num_spies(self, num_spies):
        self.num_spies = num_spies

