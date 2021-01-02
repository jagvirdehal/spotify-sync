// Import socket module
const socket = io();

// Get path value
const myPath = document.location.pathname.slice(1);

// Declare default user object
let user = {
    name: 'Name',
    id: 'Id',
    image: "https://i.scdn.co/image/ab67616d0000b27398e08f603553915a041b6937",
    room: myPath,
};

let mySongData;

// User data update callback
const userDataSuccess = (res) => {
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

// Get music data and call callback(res)
const getMusic = (callback) => {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player",
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        type: "GET",
        success: callback,
    });
}

// Update mySongData
const updateMusic = () => {
    getMusic((res) => {
        mySongData = {
            is_playing: res.is_playing,
            progress_ms: res.progress_ms,
            track_id: res.item.id,
        }
    });
}

// Set music data
const setMusic = (songData) => {
    const curData = mySongData;

    if (curData.track_id !== songData.track_id) {
        // Set track
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/play",
            headers: {
                'Authorization': 'Bearer ' + access_token,
            },
            data: JSON.stringify({
                uris: [`spotify:track:${songData.track_id}`],
                position_ms: songData.progress_ms,
            }),
            type: "PUT",
        });
    } else if (Math.abs(curData.progress_ms - songData.progress_ms) > 3000) {
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/seek?" + $.param({ position_ms: songData.progress_ms }),
            headers: {
                'Authorization': 'Bearer ' + access_token,
            },
            type: "PUT",
        })
    }

    if (curData.is_playing !== songData.is_playing) {
        $.ajax({
            url: `https://api.spotify.com/v1/me/player/${songData.is_playing ? "play" : "pause"}`,
            headers: {
                'Authorization': 'Bearer ' + access_token,
            },
            type: "PUT",
        })
    }
}

// Send music data to server
const sendMusic = () => {
    if (app.host.id !== user.id)
        return;
    
    getMusic((res) => {
        const songData = {
            is_playing: res.is_playing,
            progress_ms: res.progress_ms,
            track_id: res.item.id,
        };

        socket.emit('update-music', user, songData);
    });
}

// Socket handlers
// Receive debug messages
socket.on('message', (msg) => {
    console.log(msg);
});

// Receive redirect URI
socket.on('redirect', (url) => {
    if (document.location.pathname !== url.path) {
        socket.close();
        document.location.href = url.path;
    }
});

// Receive list of users in room
socket.on('get-users', (users) => {
    app.users = users;
});

// Receive room host
socket.on('get-host', (host) => {
    app.host = host;
});

// Receive request to re-create room
socket.on('force-create', () => {
    socket.emit('create-room', user);
});

// Receive songData to update player
socket.on('update-music', (songData) => {
    setMusic(songData);
});

// Receive disconnect signal
socket.on('disconnect', () => {
    socket.removeAllListeners();
    socket.disconnect();
});

// GET request for user data
$.ajax({
    url: "https://api.spotify.com/v1/me",
    headers: {
        'Authorization': 'Bearer ' + access_token
    },
    type: "GET",
    success: userDataSuccess
});

setInterval(updateMusic, 500);
setInterval(sendMusic, 5000);
