class GameManager:
    def __init__(self):
        # Key: game code
        # Value: Game object
        self.games = {}

    def add_game(self, game):
        self.games[game.code] = game
        return game

    def get_game(self, code):
        return self.games.get(code)