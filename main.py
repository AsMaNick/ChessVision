import chess
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from flask_assets import Environment, Bundle
from database import *

        
app = Flask(__name__)
socketio = SocketIO(app)
assets = Environment()
assets.init_app(app)


def get_str(board):
    return str(board).replace(' ', '').replace('\n', '')


@app.route('/games')
def games():
    return render_template('new_game.html')

    
@app.route('/games/<int:game_id>/<string:color>')
def game_session(game_id, color):
    print(game_id, color)
    if color != 'white' and color != 'black':
        return 'Invalid color'
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        return 'Invalid game id'
    return render_template('main.html', game_id=game_id, color=color)
    
    
def get_data(game_id):
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        res = {
            'status': 'not exist'
        }
    else:
        board = chess.Board(game.fen)
        moves = [str(move) for move in board.legal_moves]
        game_status = 'active'
        if board.is_checkmate():
            game_status = 'checkmate'
        elif board.is_stalemate():
            game_status = 'stalemate'
        elif board.is_insufficient_material():
            game_status = 'insufficient material'
        res = {
            'status': 'ok',
            'game_id': game.id,
            'name_white': game.name_white,
            'name_black': game.name_black,
            'duration': game.duration,
            'time_add': game.time_add,
            'fen': game.fen,
            'moves': moves,
            'spent_time_white': game.spent_time_white,
            'spent_time_black': game.spent_time_black,
            'last_move_time': game.last_move_time,
            'game_status': game_status
        }
    return res
    
    
@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game_data(game_id):
    return jsonify(get_data(game_id))
    
    
@app.route('/api/games/create', methods=['POST'])
def create_game():
    data = request.json
    game = Game.create(name_white=data['name_white'],
                       name_black=data['name_black'],
                       duration=data['duration'],
                       timeadd=data['time_add'])
    return jsonify(get_data(game.id))
    
    
@socketio.on('processMove')
def recieve_move(data, methods=['GET', 'POST']):
    move = data['move']
    game = Game.get_or_none(Game.id == data['game_id'])
    if game is None:
        return
    board = chess.Board(game.fen)
    cur_time = time()
    if game.last_move_time == 0:
        game.last_move_time = cur_time
    if game.fen[game.fen.find(' ') + 1] == 'w':
        game.spent_time_white += cur_time - game.last_move_time
    else:
        game.spent_time_black += cur_time - game.last_move_time
    game.last_move_time = cur_time
    try:
        board.push_uci(move)
    except Exception as e:
        board.push_uci(move + 'q')
    game.fen = board.fen()
    game.save()
    socketio.emit('updatePosition', get_data(data['game_id']))
    
    
if __name__ == '__main__':
	socketio.run(app, debug=True)