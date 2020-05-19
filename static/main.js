var BOARD_SIZE = 500;

function getPieceColor(c) {
    if (c.toLowerCase() == c.toUpperCase()) {
        return '';
    }
    if (c == c.toLowerCase()) {
        return 'black';
    }
    return 'white';
}

function getPieceType(c) {
    c = c.toLowerCase();
    if (c == 'p') {
        return 'pawn';
    } else if (c == 'n') {
        return 'knight';
    } else if (c == 'b') {
        return 'bishop';
    } else if (c == 'r') {
        return 'rook';
    } else if (c == 'q') {
        return 'queen';
    } else if (c == 'k') {
        return 'king';
    }
    return '';
}

function getPieceClass(c) {
    return getPieceColor(c) + '-' + getPieceType(c);
}

function drawCoordinates(white) {
    var num = 0;
    for (var element of document.getElementsByClassName("number")) {
        if (white) {
            element.innerHTML = 8 - num;
        } else {
            element.innerHTML = 1 + num;
        }
        num += 1;
    }
    num = 0;
    for (var element of document.getElementsByClassName("letter")) {
        if (white) {
            element.innerHTML = String.fromCharCode('a'.charCodeAt(0) + num);
        } else {
            element.innerHTML = String.fromCharCode('a'.charCodeAt(0) + 7 - num);
        }
        num += 1;
    }
}

function calcVisibility(s, color) {
    if (data.game_status != 'active') {
        return new Array(64).fill(1);
    }
    var res = new Array(64).fill(0);
    for (var i = 0; i < 8; ++i) {
        for (var j = 0; j < 8; ++j) {
            var c = s[i * 8 + j];
            if (c == '.' || getPieceColor(c) != color) {
                continue;
            }
            res[i * 8 + j] = 1;
            if (c == 'P') {
                if (i == 6 && s[(i - 1) * 8 + j] == '.') {
                    res[(i - 2) * 8 + j] = 1; 
                }
                res[(i - 1) * 8 + j] = 1; 
                if (j) {
                    res[(i - 1) * 8 + j - 1] = 1; 
                }
                if (j + 1 < 8) {
                    res[(i - 1) * 8 + j + 1] = 1; 
                }
                continue;
            }
            if (c == 'p') {
                if (i == 1 && s[(i + 1) * 8 + j] == '.') {
                    res[(i + 2) * 8 + j] = 1; 
                }
                res[(i + 1) * 8 + j] = 1; 
                if (j) {
                    res[(i + 1) * 8 + j - 1] = 1; 
                }
                if (j + 1 < 8) {
                    res[(i + 1) * 8 + j + 1] = 1; 
                }
                continue;
            }
            c = c.toLowerCase();
            var candidates = [];
            if (c == 'k') {
                candidates.push([i - 1, j - 1]);
                candidates.push([i - 1, j]);
                candidates.push([i - 1, j + 1]);
                candidates.push([i, j - 1]);
                candidates.push([i, j + 1]);
                candidates.push([i + 1, j - 1]);
                candidates.push([i + 1, j]);
                candidates.push([i + 1, j + 1]);
            } else if (c == 'n') {
                candidates.push([i - 2, j - 1]);
                candidates.push([i - 2, j + 1]);
                candidates.push([i - 1, j - 2]);
                candidates.push([i - 1, j + 2]);
                candidates.push([i + 1, j - 2]);
                candidates.push([i + 1, j + 2]);
                candidates.push([i + 2, j - 1]);
                candidates.push([i + 2, j + 1]);
            }
            if (c == 'b' || c == 'q') {
                for (var dx = -1; dx <= 1; dx += 2) {
                    for (var dy = -1; dy <= 1; dy += 2) {
                        var x = i + dx, y = j + dy;
                        while (0 <= x && 0 <= y && x < 8 && y < 8) {
                            res[x * 8 + y] = 1;
                            if (s[x * 8 + y] != '.') {
                                break;
                            }
                            x += dx;
                            y += dy;
                        }
                    }
                }
            }
            if (c == 'r' || c == 'q') {
                for (var dx = -1; dx <= 1; ++dx) {
                    for (var dy = -1; dy <= 1; ++dy) {
                        if ((dx == 0 && dy == 0) || (dx != 0 && dy != 0)) {
                            continue;
                        }
                        var x = i + dx, y = j + dy;
                        while (0 <= x && 0 <= y && x < 8 && y < 8) {
                            res[x * 8 + y] = 1;
                            if (s[x * 8 + y] != '.') {
                                break;
                            }
                            x += dx;
                            y += dy;
                        }
                    }
                }
            }
            for (var p of candidates) {
                if (0 <= p[0] && 0 <= p[1] && p[0] < 8 && p[1] < 8) {
                    res[p[0] * 8 + p[1]] = 1;
                }
            }
        }
    }
    return res;
}

function getCellNumberByNotation(s) {
    return (8 - parseInt(s[1])) * 8 + (s.charCodeAt(0) - 'a'.charCodeAt(0));
}

function isLastMove(last_move, i, j) {
    var num = i * 8 + j;
    return last_move.length >= 4 && (num == getCellNumberByNotation(last_move.substr(0, 2)) || 
                                       num == getCellNumberByNotation(last_move.substr(2, 2)));
}

function drawPosition(s, color) {
    var white = (color == "white");
    drawCoordinates(white);
    pieces_div = document.getElementsByClassName("pieces")[0];
    pieces_div.innerHTML = '';
    visibility = calcVisibility(s, color);
    for (var i = 0; i < 8; ++i) {
        for (var j = 0; j < 8; ++j) {
            var row = i, column = 7 - j;
            if (white) {
                row = 7 - i;
                column = j;
            }
            var x = column * 100;
            var y = (7 - row) * 100;
            if (!visibility[i * 8 + j]) {
                var piece = document.createElement('div');
                piece.className = 'piece ' + color + '-darkness';
                piece.style = `transform: translate(${x}%, ${y}%);`;
                pieces_div.appendChild(piece);   
                continue;
            }
            if (isLastMove(data.last_move, i, j)) {
                var move_square = document.createElement('div');
                move_square.className = 'piece move-square';
                move_square.style = `transform: translate(${x}%, ${y}%);`;
                pieces_div.appendChild(move_square);   
            }
            var c = s[i * 8 + j];
            if (c == '.') {
                continue;
            }
            var piece = document.createElement('div');
            piece.className = 'piece ' + getPieceClass(c);
            piece.style = `transform: translate(${x}%, ${y}%);`;
            pieces_div.appendChild(piece);   
        }
    }
}

function isDigit(c) {
    return '0' <= c && c <= '9';
}

function parseIntList(s) {
    var res = [];
    var last = "";
    for (var c of s) {
        if (c == '-' || c == '.' || isDigit(c)) {
            last += c;
        } else if (last != "") {
            res.push(parseFloat(last));
            last = "";
        }
    }
    return res;
}

var dragObject = {};

function movePiece(e) {
    var dx = e.pageX - dragObject.startX;
    var dy = e.pageY - dragObject.startY;
    var x = Math.max(0, Math.min(BOARD_SIZE * 0.875, dragObject.cellX * 0.125 * BOARD_SIZE + dx));
    var y = Math.max(0, Math.min(BOARD_SIZE * 0.875, (7 - dragObject.cellY) * 0.125 * BOARD_SIZE + dy));
    dragObject.elem.style = `transform: translate(${x}px, ${y}px);`;
}

document.onmousedown = function(e) {
    if (e.which != 1 || dragObject.elem || data.status != 'ok' || data.color != data.current_move || data.game_status != 'active') {
        return;
    }
    var elem = e.target.closest('.piece');
    if (!elem) {
        return;
    }
    var translate = parseIntList(elem.style.transform);
    var x = translate[0] / 100, y = 7 - translate[1] / 100;
    var row = y, column = 7 - x;
    if (data.color == 'white') {
        row = 7 - row;
        column = 7 - column;
    }
    if (getPieceColor(data.current_position[row * 8 + column]) != data.color) {
        return;
    }
    elem.className += ' dragging';
    dragObject.elem = elem;
    dragObject.startX = e.pageX;
    dragObject.startY = e.pageY;
    dragObject.cellX = x;
    dragObject.cellY = y;
    movePiece(e);
}

document.onmousemove = function(e) {
    if (!dragObject.elem) {
        return;
    }
    movePiece(e);
}

function getCellNotation(x, y) {
    if (data.color == 'black') {
        x = 7 - x;
        y = 7 - y;
    }
    return String.fromCharCode('a'.charCodeAt(0) + x) + (y + 1);
}

document.onmouseup = function(e) {
    if (!dragObject.elem) {
        return;
    }
    var translate = parseIntList(dragObject.elem.style.transform);
    var x = translate[0], y = translate[1];
    var closest = {
        x: dragObject.cellX,
        y: dragObject.cellY
    };
    var closestDist = BOARD_SIZE * BOARD_SIZE;
    for (var i = 0; i < 8; ++i) {
        for (var j = 0; j < 8; ++j) {
            var cx = i * 0.125 * BOARD_SIZE;
            var cy = (7 - j) * 0.125 * BOARD_SIZE;
            var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
            if (closestDist > d && d < BOARD_SIZE * 0.125 / 2) {
                closestDist = d;
                closest.x = i;
                closest.y = j;
            }
        }
    }
    if (dragObject.cellX != closest.x || dragObject.cellY != closest.y) {
        var move = getCellNotation(dragObject.cellX, dragObject.cellY) + getCellNotation(closest.x, closest.y);
        if (!data.moves.includes(move)) {
            move += 'q';
        }
        if (!data.moves.includes(move)) {
            closest.x = dragObject.cellX;
            closest.y = dragObject.cellY;
        } else {
            socket.emit('processMove', {
                game_id: data.game_id,
                move: move
            });
        }
    }
    dragObject.elem.className = dragObject.elem.className.substr(0, dragObject.elem.className.indexOf(' dragging'));
    dragObject.elem.style = `transform: translate(${closest.x * 100}%, ${(7 - closest.y) * 100}%);`;
    dragObject.elem = null;
}

function parseFen(fen) {
    fen = fen.substr(0, fen.indexOf(' '));
    res = ''
    for (var c of fen) {
        if (isDigit(c)) {
            for (var i = 0; i < c.charCodeAt(0) - '0'.charCodeAt(0); ++i) {
                res += '.';
            }
        } else if (c != '/') {
            res += c;
        }
    }
    return res;
}

const zeroPad = (num, places) => String(num).padStart(places, '0')

function calculateTime(t) {
    t = parseInt(t);
    var h = parseInt(t / 3600);
    t %= 3600;
    var m = parseInt(t / 60);
    t %= 60;
    var s = t;
    return zeroPad(h, 1) + ':' + zeroPad(m, 2) + ':' + zeroPad(s, 2);
}

function updateTime() {
    var elems = document.getElementsByClassName('player');
    var black_moves = parseInt(data.fen.substr(data.fen.lastIndexOf(' ') + 1)) - 1;
    var white_moves = black_moves;
    if (data.current_move == 'black') {
        ++white_moves;
    }
    var t1 = data.duration - data.spent_time_white + white_moves * data.time_add;
    var t2 = data.duration - data.spent_time_black + black_moves * data.time_add;
    if (data.last_move_time > 0) {
        if (data.current_move == 'white') {
            t1 -= Date.now() / 1000 - data.last_move_time;
        } else {
            t2 -= Date.now() / 1000 - data.last_move_time;
        }
    }
    if (data.game_status == 'active' && (t1 < 0 || t2 < 0)) {
        socket.emit('processMove', {
            game_id: data.game_id,
            move: 'timeout'
        });
    }
    t1 = Math.max(0, t1);
    t2 = Math.max(0, t2);
    var name1 = data.name_white;
    var name2 = data.name_black;
    if (data.color == 'white') {
        var tmp = t1;
        t1 = t2;
        t2 = tmp;
        tmp = name1;
        name1 = name2;
        name2 = tmp;
    }
    elems[0].innerHTML = name1 + ' (' + calculateTime(t1) + ')';
    elems[1].innerHTML = name2 + ' (' + calculateTime(t2) + ')';
    if (data.game_status == 'active') {
        if (data.color == data.current_move) {
            elems[0].className = 'player';
            elems[1].className = 'player active-player';
        } else {
            elems[0].className = 'player active-player';
            elems[1].className = 'player';
        }
        setTimeout(function() {
            updateTime();
        }, 500);
    } else if (data.game_status == 'checkmate' || data.game_status == 'timeout') {
        if (data.color == data.current_move) {
            elems[0].className = 'player active-player';
            elems[1].className = 'player';
            elems[0].innerHTML += ' Win by ' + data.game_status;
            elems[1].innerHTML += ' Lose by ' + data.game_status;
        } else {
            elems[0].className = 'player';
            elems[1].className = 'player active-player';
            elems[0].innerHTML += ' Lose by ' + data.game_status;
            elems[1].innerHTML += ' Win by ' + data.game_status;
        }
    } else {
        elems[0].className = 'player';
        elems[1].className = 'player';
        elems[0].innerHTML += ' Draw by ' + data.game_status;
        elems[1].innerHTML += ' Draw by ' + data.game_status;
    }
}

function updateData(color) {
    data.color = color;
    data.current_move = data.fen[data.fen.indexOf(' ') + 1];
    data.current_position = parseFen(data.fen);
    if (data.current_move == 'w') {
        data.current_move = 'white';
    } else {
        data.current_move = 'black';
    }
}

function init(game_id, color) {
    $.getJSON('http://' + document.domain + ':' + location.port + '/api/games/' + game_id, function(recieved_data) {
        data = recieved_data;
        if (data.status != 'ok') {
            alert('Error happend: ', data.status);
            return;
        }
        updateData(color);
        socket = io.connect('http://' + document.domain + ':' + location.port);
        socket.on('updatePosition', function(recieved_data) {
            data = recieved_data;
            updateData(color);
            drawPosition(parseFen(data.fen), color);
            updateTime();
        });
        drawPosition(parseFen(data.fen), color);
        updateTime();
    });
}

function loadPGN() {
    if (data.status != 'ok') {
        return;
    }
    $.getJSON('http://' + document.domain + ':' + location.port + '/api/games/' + data.game_id + '/pgn', function(recieved_data) {
        document.getElementById('pgn').innerHTML = '<textarea style="width: 100%; height: 200px">' + recieved_data.pgn + '</textarea>';
    });
}

var data = {'status': 'not_loaded'};
var socket;