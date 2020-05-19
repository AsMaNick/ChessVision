from time import time
from peewee import *


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
        
        
if __name__ == '__main__':
    Game.create_table()
