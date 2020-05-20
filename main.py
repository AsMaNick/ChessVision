import os
import chess
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO
from flask_assets import Environment, Bundle
from database import *

        
app = Flask(__name__)
socketio = SocketIO(app)
assets = Environment()
assets.init_app(app)


def get_str(board):
    return str(board).replace(' ', '').replace('\n', '')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/gen/img'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')
                               
                               
@app.route('/new_game')
def new_game():
    return render_template('new_game.html')

    
@app.route('/games')
def games():
    return render_template('games.html', games=Game.select())
    
    
@app.route('/games/<int:game_id>/<string:color>')
def game_session(game_id, color):
    if color != 'white' and color != 'black':
        return 'Invalid color'
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        return 'Invalid game id'
    return render_template('main.html', game_id=game_id, color=color)
    
    
@app.route('/games/<int:game_id>/<string:color>/review')
def game_review(game_id, color):
    if color != 'white' and color != 'black':
        return 'Invalid color'
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        return 'Invalid game id'
    return render_template('game_review.html', game_id=game_id, color=color)


def get_data(game_id):
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        res = {
            'status': 'not exist'
        }
    else:
        board = chess.Board(game.fen)
        moves = [str(move) for move in board.legal_moves]
        game_status = game.get_game_status()
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
            'last_move': game.last_move,
            'game_status': game_status
        }
    return res
    
    
@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game_data(game_id):
    return jsonify(get_data(game_id))
    

@app.route('/api/games/<int:game_id>/pgn', methods=['GET'])
def get_game_pgn(game_id):
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        res = {
            'status': 'not exist'
        }
    else:
        result, termination = game.get_result()
        pgn = '''[Event "Live Chess"]
[Site "chessvision.com"]
[White "{}"]
[Black "{}"]
[Result "{}"]
[TimeControl "{}+{}"]
[Termination "{}"]

'''.format(game.name_white, game.name_black, result, int(game.duration), int(game.time_add), termination)
        board = chess.Board()
        for num, move in enumerate(game.parse_moves()):
            pgn += f'{1 + num // 2}.{"." * 2 * (num % 2)} {board.san(chess.Move.from_uci(move))} '
            board.push_uci(move)
        if result != '?':
            pgn += result
        res = {
            'status': 'ok',
            'pgn': pgn
        }
    return jsonify(res)
    
    
@app.route('/api/games/<int:game_id>/states', methods=['GET'])
def get_game_states(game_id):
    game = Game.get_or_none(Game.id == game_id)
    if game is None:
        res = {
            'status': 'not exist'
        }
    else:
        board = chess.Board()
        moves_uci = []
        moves_san = []
        states = [board.fen()]
        for num, move in enumerate(game.parse_moves()):
            moves_uci.append(move)
            moves_san.append(board.san(chess.Move.from_uci(move)))
            board.push_uci(move)
            states.append(board.fen())
        res = {
            'status': 'ok',
            'moves_uci': moves_uci,
            'moves_san': moves_san,
            'states': states
        }    
    return jsonify(res)
    
    
@app.route('/api/games/create', methods=['POST'])
def create_game():
    data = request.json
    game = Game.create(name_white=data['name_white'],
                       name_black=data['name_black'],
                       duration=data['duration'],
                       time_add=data['time_add'])
    return jsonify(get_data(game.id))
    
    
@socketio.on('processMove')
def recieve_move(data, methods=['GET', 'POST']):
    move = data['move']
    game = Game.get_or_none(Game.id == data['game_id'])
    if game is None:
        return
    board = chess.Board(game.fen)
    cur_time = time()
    if game.get_game_status() != 'active':
        socketio.emit('updatePosition', get_data(data['game_id']))
        return    
    if move == 'timeout':
        return
    if game.last_move_time == 0:
        game.last_move_time = cur_time
    if game.get_current_color() == 'white':
        game.spent_time_white += cur_time - game.last_move_time
    else:
        game.spent_time_black += cur_time - game.last_move_time
    try:
        board.push_uci(move)
    except Exception as e:
        try:
            move += 'q'
            board.push_uci(move)
        except Exception as e:
            return
    game.add_move(move)
    game.last_move_time = cur_time
    game.fen = board.fen()
    game.save()
    socketio.emit('updatePosition', get_data(data['game_id']))
    
    
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
