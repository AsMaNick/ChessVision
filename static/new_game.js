function create() {
    var name1 = document.getElementById('name1').value;
    var name2 = document.getElementById('name2').value;
    var duration = document.getElementById('duration').value;
    var timeadd = parseInt(document.getElementById('timeadd').value);
    duration = 3600 * parseInt(duration.substr(0, 1)) + 60 * parseInt(duration.substr(2, 2)) + parseInt(duration.substr(5, 2))
    var data = {
        name_white: name1,
        name_black: name2,
        duration: duration,
        timeadd: timeadd,
    }
    $.ajax('http://' + document.domain + ':' + location.port + '/api/games/create', {
        data: JSON.stringify(data),
        contentType: 'application/json',
        type: 'POST', success: function (data) {
            document.location.href = 'http://' + document.domain + ':' + location.port + '/games/' + data.game_id + '/white';
        }
    });
}
