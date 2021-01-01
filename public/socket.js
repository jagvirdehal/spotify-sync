// Code from W3schools
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

const socket = io();
const myPath = document.location.pathname.slice(1);

let user = {
    name: 'Jagvir',
    id: '48asdasasdasdad',
    image: "https://i.scdn.co/image/ab67616d0000b27398e08f603553915a041b6937",
    room: myPath,
};

const success = (res) => {
    user.name = res.display_name;
    user.id = res.id;
    user.image = (res.images.length > 0) ?
        res.images[0].url :
        "https://t4.ftcdn.net/jpg/03/46/93/61/360_F_346936114_RaxE6OQogebgAWTalE1myseY1Hbb5qPM.jpg";

    if (myPath === '') {
        socket.emit('create-room', user);
    } else {
        socket.emit('join-room', user);
    }
};

$.ajax({
    url: "https://api.spotify.com/v1/me",
    headers: {
        'Authorization': 'Bearer ' + access_token
    },
    type: "GET",
    success: success
});

socket.on('message', (msg) => {
    console.log(msg);
});

socket.on('redirect', (url) => {
    if (document.location.pathname !== url.path)
        document.location.href = url.path;
});

socket.on('get-users', (users) => {
    app.users = users;
});
