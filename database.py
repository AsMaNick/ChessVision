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
    last_move = CharField(default='')
    
    
Game.create_table()
