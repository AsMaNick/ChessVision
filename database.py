from time import time
from peewee import *


db = SqliteDatabase('data/chess_vision.db')


class BaseModel(Model):
    class Meta:
        database = db
        

class Game(BaseModel):
    name_white = CharField()
    name_black = CharField()
    duration = FloatField(default=300)
    time_add = FloatField(default=2)
    fen = CharField(default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    spent_time_white = FloatField(default=0)
    spent_time_black = FloatField(default=0)
    last_move_time = FloatField(default=0)
    
    
Game.create_table()
g = Game.get(Game.id == 3)
g.fen = '7k/7P/7K/8/8/8/8/8 b - - 0 1'
g.last_move_time = 0
g.spent_time_white = 0
g.spent_time_black = 0
g.save()
