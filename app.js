// Libraries
const fs = require('fs');

const express = require('express'); // Express web server framework
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 8888;

// Express addons
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

// Used for generating room URLs
const randomWords = require('random-words');

// Get lobby and usermap from lobby.js
const [lobby, userMap] = require('./lobby.js');

// Module for making POST and GET requests to Spotify
const request = require('request'); // "Request" library

// Client id and secret
let client_id, client_secret;
try {
    client_id = fs.readFileSync('client_id.txt', { encoding: "utf-8", flag: "r" }).trim(); // Your client id
    client_secret = fs.readFileSync('client_secret.txt', { encoding: "utf-8", flag: "r" }).trim(); // Your secret
} catch (err) {
    client_id = process.env.CLIENT_ID;
    client_secret = process.env.CLIENT_SECRET;
}
const redirect_uri = 'https://4195235527ee.ngrok.io/callback'; // Your redirect uri

// Generate string function
const generateRandomString = (length) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

// Error response function
const errorRes = (res, error) => {
    res.redirect('/login#' +
        querystring.stringify({
            error: error
        })
    );
}

// Cookie keys
const loggedInKey = 'logged_in';
const accessTokenKey = 'access_token';
const refreshTokenKey = 'refresh_token';
const expiresInKey = 'expires_in';
const issueTimeKey = 'issue_time';
const stateKey = 'spotify_auth_state';

// Express App settings
app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

let TOTAL_SOCKETS = new Set();

const cleanAllRooms = () => {
    for (let room of lobby.rooms.keys())
        lobby.clean(room);
};

// Connection and broadcasting logic
io.on('connection', (socket) => {
    TOTAL_SOCKETS.add(socket.id);

    socket.on('create-room', (user) => {
        let room;
        let id = user.id;
        
        // Generate roomnames until unique room is found
        do {
            room = randomWords({exactly: 4, join: '-', maxLength: 6});
        } while (room in lobby.rooms);

        // Add/update user in userMap, and create lobby room
        userMap.add(user);
        lobby.create(room, id);

        // Leave all rooms
        socket.rooms.forEach(roomname => {
            socket.leave(roomname);
        });

        // Attach socket to room and user
        socket.join(room);
        socket.join(id);

        // Redirect
        socket.emit('redirect', {path: `/${room}`});
    });

    socket.on('join-room', (user) => {
        let room = user.room;
        let userId = user.id;
        let host, hostId;
        let users, uids;

        // Join user to the room
        if (lobby.join(room, userId)) { // True if room does not exist
            socket.emit('force-create');
            return;
        }

        // Update user
        userMap.add(user);
        
        // Leave all rooms
        socket.rooms.forEach(roomname => {
            socket.leave(roomname);
        });

        // Leave all lobby rooms
        let sockets = userMap.getSockets(userId);
        if (sockets) {
            for (let socketId of sockets) {
                io.sockets.sockets.get(socketId).rooms.forEach(roomname => {
                    if (userMap.getRoom(userId) !== roomname)
                        lobby.leave(roomname, userId);
                });
            }
        }

        // Redirect all user sockets to the latest room
        io.to(userId).emit('redirect', {path: `/${user.room}`});
        
        // Attach socket to room and user
        socket.join(room);
        socket.join(userId);
        userMap.addSocket(userId, socket.id);

        // Get users
        uids = lobby.getListeners(room);
        users = uids.map((user, index) => {
            return userMap.get(user);
        });
        hostId = lobby.getHost(room);
        host = userMap.get(hostId);

        // If there are too many lobbies, clean
        if (lobby.rooms.size > userMap.users.size + 5)
            cleanAllRooms();

        io.to(room).emit('message', `${user.name} has entered the room ${room}`);
        io.to(room).emit('message', `${uids} are in the room ${room}`);
        io.to(room).emit('get-users', users);
        io.to(room).emit('get-host', host);
        io.emit('message', `${JSON.stringify(Object.keys(lobby))}`);
    });

    socket.on('update-music', (user, songData) => {
        if (user.id !== lobby.getHost(user.room) || lobby.rooms.get(user.room) === undefined)
            return;

        for (let member of lobby.rooms.get(user.room)) {
            if (member === user.id)
                continue;
            
            if (userMap.getSockets(member) !== undefined) {
                for (let socketId of userMap.getSockets(member)) {
                    io.sockets.sockets.get(socketId).emit('update-music', songData);
                    break;
                }
            }
        }
    });

    socket.on('disconnecting', () => {
        TOTAL_SOCKETS.delete(socket.id);
        socket.rooms.forEach(roomname => {
            let userId = roomname;
            let socketList = userMap.getSockets(userId);

            if (!socketList) {
                return;
            }

            for (let socketId of socketList) {
                if (socketId === socket.id || !TOTAL_SOCKETS.has(socketId)) {
                    userMap.removeSocket(userId, socketId);
                }
            }

            socketList = userMap.getSockets(userId);

            if (socketList.size === 0) {
                // Remove user from server
                userMap.remove(userId);
                // Remove user from all rooms
                for (let room of lobby.rooms.keys()) {
                    lobby.leave(room, userId)
                }
            }
        });
    });
});

// setInterval(() => {
//     console.log("Update:");
//     console.log(TOTAL_SOCKETS);
//     console.log(userMap.sockets);
//     console.log(lobby.rooms);
// }, 1000);

// Login page render
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Login method call
app.get('/loginCall', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    const scope = 'user-read-private' +
                  ' user-read-email' +
                  ' user-read-recently-played' +
                  ' user-read-playback-state' +
                  ' app-remote-control' +
                  ' user-modify-playback-state' +
                  ' user-read-currently-playing' +
                  ' user-read-playback-position';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        })
    );
});

// Callback from the login request
app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        errorRes(res, 'state_mismatch');
    } else {
        res.clearCookie(stateKey);
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {

                let access_token = body.access_token,
                    refresh_token = body.refresh_token;
                    expires_in = body.expires_in;

                res.cookie(loggedInKey, true);
                res.cookie(accessTokenKey, access_token);
                res.cookie(refreshTokenKey, refresh_token);
                res.cookie(expiresInKey, expires_in);
                res.cookie(issueTimeKey, Math.floor(new Date().getTime() / 1000));

                const options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, (error, response, body) => {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/');
            } else {
                errorRes(res, invalid_token);
            }
        });
    }
});

app.get('/refresh_token', (req, res) => {
    // requesting access token from refresh token
    let refresh_token = req.query.refresh_token;
    let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let access_token = body.access_token,
                expires_in = body.expires_in;
            res.cookie(accessTokenKey, access_token);
            res.cookie(expiresInKey, expires_in);
            res.redirect('/');
            // res.send({
            //     'access_token': access_token
            // });
        }
    });
});

// Catch-all route
app.all('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

http.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
