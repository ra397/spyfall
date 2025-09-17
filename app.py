from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, join_room, emit
from models.player import Player
from models.game import Game
from models.game_manager import GameManager

from utils.generate_code import generate_code
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev'
socketio = SocketIO(app, cors_allowed_origins="*")

game_manager = GameManager()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/new')
def new():
    return render_template('new.html')

@app.route('/join')
def join():
    return render_template('join.html')

@app.route('/rooms')
def create_room():
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({"error": "No name provided"}), 400
    player = Player(name)
    player.set_owner(True)
    code = generate_code()
    game = Game(code)
    added = game.add_player(player)
    if not added:
        return jsonify({"error": "Name is not unique"}), 400
    game_manager.add_game(game)
    return jsonify({"code": code})

@app.route('/rooms/join')
def join_room_http():
    name = request.args.get('name', '').strip()
    code = request.args.get('code', '').strip()
    if not name:
        return jsonify({"error": "No name provided"}), 400
    if not code:
        return jsonify({"error": "Code not provided"}), 400
    game = game_manager.get_game(code)
    if not game:
        return jsonify({"error": "Room not found."})
    player = Player(name)
    added = game.add_player(player)
    if not added:
        return jsonify({"error": "Name is not unique"})
    return jsonify({"code": game.get_code()})

@app.route('/rooms/<code>')
def lobby(code):
    valid_code = game_manager.get_game(code)
    if not valid_code:
        return jsonify({"error": "Code not found."}), 400
    return render_template("room.html", code=code)

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    join_room(room) # Join Room
    players = game_manager.get_game(room).get_player_names()
    emit("player_joined", { "players": players }, to=room) # Notify all others in room that new players has join (to update the players list)
    print(f"{data['name']} joined {data['room']}")

if __name__ == '__main__':
    socketio.run(app)