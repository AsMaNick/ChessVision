from time import time
from peewee import *
import chess


db = SqliteDatabase('data/chess_vision.db')


class BaseModel(Model):
    class Meta:
        database = db
        

def get_cell_notation(cell):
    cell = ord(cell) - 32
    return chr(ord('a') + cell // 8) + str(cell % 8 + 1)
            
            
class Game(BaseModel):
    name_white = CharField()
    name_black = CharField()
    duration = FloatField(default=300)
    time_add = FloatField(default=2)
    fen = CharField(default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    spent_time_white = FloatField(default=0)
    spent_time_black = FloatField(default=0)
    last_move_time = FloatField(default=0)
    moves_history = TextField(default='')
    
    @property
    def last_move(self):
        if len(self.moves_history) == 0:
            return ''
        if 'a' <= self.moves_history[-1] <= 'z':
            return get_cell_notation(self.moves_history[-3]) + get_cell_notation(self.moves_history[-2]) + self.moves_history[-1]
        return get_cell_notation(self.moves_history[-2]) + get_cell_notation(self.moves_history[-1])
       
    def add_move(self, move):
        def get_cell_num(cell):
            return 32 + (ord(cell[0]) - ord('a')) * 8 + ord(cell[1]) - ord('1')
        self.moves_history += chr(get_cell_num(move[:2])) + chr(get_cell_num(move[2:4])) + move[4:]
        
    def parse_moves(self):
        res = []
        pos = 0
        while pos < len(self.moves_history):
            move = get_cell_notation(self.moves_history[pos])
            move += get_cell_notation(self.moves_history[pos + 1])
            pos += 2
            if pos < len(self.moves_history) and 'a' <= self.moves_history[pos] <= 'z':
                move += self.moves_history[pos]
                pos += 1
            res.append(move)
        return res

    def get_time_control(self):
        if self.duration > 3600:
            return '{}:{:02d}:{:02d} + {}'.format(int(self.duration) // 3600, 
                                                  int(self.duration) % 3600 // 60, 
                                                  int(self.duration) % 60, int(self.time_add))
        return '{}:{:02d} + {}'.format(int(self.duration) // 60,
                                           int(self.duration) % 60, int(self.time_add))
                                           
    def get_current_color(self):
        if self.fen[self.fen.find(' ') + 1] == 'w':
            return 'white'
        return 'black'
        
    def get_game_status(self):
        board = chess.Board(self.fen)
        game_status = 'active'
        if board.is_checkmate():
            game_status = 'checkmate'
        elif board.is_stalemate():
            game_status = 'stalemate'
        elif board.is_insufficient_material():
            game_status = 'insufficient material'
        black_moves = int(self.fen[self.fen.rfind(' ') + 1:]) - 1
        white_moves = black_moves
        time_white = self.spent_time_white - white_moves * self.time_add
        time_black = self.spent_time_black - black_moves * self.time_add
        if self.get_current_color() == 'black':
            white_moves += 1
        if game_status == 'active' and self.last_move_time > 0:
            if self.get_current_color() == 'white':
                time_white += time() - self.last_move_time
                if time_white >= self.duration:
                    game_status = 'timeout'
            else:
                time_black += time() - self.last_move_time
                if time_black >= self.duration:
                    game_status = 'timeout'
        return game_status
        
    def get_result(self):
        game_status = self.get_game_status()
        if game_status == 'active':
            return '?', 'active'
        if game_status == 'stalemate' or game_status == 'insufficient material':
            return '1/2-1/2', f'Draw by {game_status}'
        if self.get_current_color() == 'white':
            return '0-1', f'{self.name_black} won by {game_status}'
        else:
            return '1-0', f'{self.name_white} won by {game_status}'
            
            
if __name__ == '__main__':
    Game.create_table()
