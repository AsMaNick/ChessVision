var BOARD_SIZE = 500;

function getPieceColor(c) {
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

function drawPosition(s, color) {
    var white = (color == "white");
    drawCoordinates(white);
    pieces_div = document.getElementsByClassName("pieces")[0];
    pieces_div.innerHTML = '';
    for (var i = 0; i < 8; ++i) {
        for (var j = 0; j < 8; ++j) {
            var c = s[i * 8 + j];
            if (c == '.') {
                continue;
            }
            var piece = document.createElement('div');
            piece.className = 'piece ' + getPieceClass(c);
            var row = i, column = 7 - j;
            if (white) {
                row = 7 - i;
                column = j;
            }
            var x = column * 100;
            var y = (7 - row) * 100;
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

function updateTime(data, color) {
    var elems = document.getElementsByClassName('player');
    var t1 = data.duration - data.spent_time_white;
    var t2 = data.duration - data.spent_time_black;
    var name1 = data.name_white;
    var name2 = data.name_black;
    if (color == 'white') {
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
    } else if (data.game_status == 'checkmate') {
        if (data.color == data.current_move) {
            elems[0].className = 'player active-player';
            elems[1].className = 'player';
            elems[0].innerHTML += ' Win';
            elems[1].innerHTML += ' Lose';
        } else {
            elems[0].className = 'player';
            elems[1].className = 'player active-player';
            elems[0].innerHTML += ' Lose';
            elems[1].innerHTML += ' Win';
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
            updateTime(data, color);
        });
        drawPosition(parseFen(data.fen), color);
        updateTime(data, color);
    });
}

var data = {'status': 'not_loaded'};
var socket;