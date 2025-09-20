from flask import Flask, render_template, request, jsonify, redirect, url_for
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
    unique = game.add_player(player)
    if not unique:
        return jsonify({"error": "Name is not unique"}), 400
    game_manager.add_game(game)
    return redirect(url_for('lobby',name=name, code=code))

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
    # TODO: somewhere in here we need to check if lobby is full
    return redirect(url_for('lobby', name=name, code=code))

@app.route('/rooms/<name>&<code>')
def lobby(name, code):
    game = game_manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found."})
    player = game.get_player(name)
    if not player:
        return jsonify({"error": "Player not found."})
    return render_template("room.html", name=name, code=code, locations=game.get_locations(), owner=player.is_owner())

@socketio.on('join_room')
def handle_join_room(data):
    name = data.get('name')
    room = data.get('room')
    join_room(room)
    game = game_manager.get_game(room)
    if not game:
        return jsonify({"error": "Game not found."})
    player = game.get_player(name)
    if not player:
        return jsonify({"error": "Player not found."})
    player.set_socket_id(request.sid)
    players = game.get_player_names()
    emit('player_joined', {'players': players}, to=room)
    return None

@app.route('/rooms/<name>&<code>/start')
def start_game(name, code):
    game = game_manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found."})
    player = game.get_player(name)
    if not player:
        return jsonify({"error": "Player not found."})
    if not player.is_owner():
        return jsonify({"error": "Only owner can start a game."})
    duration = request.args.get("duration", 480)
    game.set_game_duration(duration)
    # TODO: start game
    # Assign game a location
    results = game.start()
    # Send each player a personalized message with location and occupation (or SPY)
    for socket_id, result in results.items():
        socketio.emit('game_started', { 'result': result, 'duration': game.get_game_duration() }, to=socket_id)
    return jsonify({"message": "game started"})

@app.route('/rooms/<name>&<code>/end')
def end_game(name, code):
    game = game_manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found."})
    player = game.get_player(name)
    if not player:
        return jsonify({"error": "Player not found."})
    if not player.is_owner():
        return jsonify({"error": "Only owner can end a game."})
    game.end()
    # notify room that game has ended
    for player in game.players:
        socket_id = player.get_socket_id()
        socketio.emit('game_ended', to=socket_id)
    return jsonify({"message": "game ended"})

if __name__ == '__main__':
    socketio.run(app)