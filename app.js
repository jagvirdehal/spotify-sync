// Libraries
const fs = require('fs');

const express = require('express'); // Express web server framework
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 8888;

const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const request = require('request'); // "Request" library

// Client id and secret
const client_id = fs.readFileSync('client_id.txt', { encoding: "utf-8", flag: "r" }).trim(); // Your client id
const client_secret = fs.readFileSync('client_secret.txt', { encoding: "utf-8", flag: "r" }).trim(); // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

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

io.on('connection', (socket) => {
    console.log('A user connected');
});


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

http.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
