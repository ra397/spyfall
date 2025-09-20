import random
from models.player import Player
from models.constants import locations_occupations

class Game:
    def __init__(self, code: str):
        self.code = code
        self.players = []
        self.game_duration = 480 # default - 8 minute games
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

    def add_to_locations_played(self, location):
        self.locations_played.append(location)

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

    def get_game_duration(self):
        return self.game_duration

    def start(self):
        possible_locations = self.get_locations()
        if not possible_locations:
            possible_locations = list(locations_occupations.keys())
            self.locations_played.clear()
        location = random.choice(possible_locations)
        self.add_to_locations_played(location)

        spy = random.choice(self.players)

        roles = locations_occupations[location][:]
        random.shuffle(roles)

        results = {}
        role_index = 0

        for player in self.players:
            if player == spy:
                results[player.get_socket_id()] = {
                    "location": "Unknown",
                    "occupation": "Spy",
                }
            else:
                occupation = roles[role_index % len(roles)]
                results[player.get_socket_id()] = {
                    "location": location,
                    "occupation": occupation,
                }
                role_index += 1
        return results

    def end(self):
        self.set_game_duration(480)