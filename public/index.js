// Cookie keys
const loggedInKey = 'logged_in';
const accessTokenKey = 'access_token';
const refreshTokenKey = 'refresh_token';
const expiresInKey = 'expires_in';
const issueTimeKey = 'issue_time';

const REFRESH_BUFFER = 60;

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

var userProfileSource = document.getElementById('user-profile-template').innerHTML,
    userProfileTemplate = Handlebars.compile(userProfileSource),
    userProfilePlaceholder = document.getElementById('user-profile');

let access_token = getCookie(accessTokenKey),
    refresh_token = getCookie(refreshTokenKey),
    issue_time = getCookie(issueTimeKey),
    expires_in = getCookie(expiresInKey);

const refreshToken = () => {
    $.ajax({
        url: '/refresh_token',
        data: {
            'refresh_token': refresh_token
        }
    }).done(function (data) {
        access_token = getCookie(accessTokenKey);
        expires_in = getCookie(expiresInKey);
        issue_time = getCookie(issueTimeKey);
    });
}

if (access_token) {
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function (response) {
            userProfilePlaceholder.innerHTML = userProfileTemplate(response);
        }
    });
} else {
    // render initial screen
    window.location.href = "/login";
}

    // Check every 30 seconds for expiry
    setInterval(() => {
        let currentTime = new Date().getTime() / 1000;
        let elapsedTime = currentTime - issue_time;
        if (elapsedTime > expires_in - REFRESH_BUFFER) {
            refreshToken();
        }
    }, 30);

    // document.getElementById('obtain-new-token').addEventListener('click', function () {
    //     $.ajax({
    //         url: 'https://api.spotify.com/v1/me/player/pause',
    //         headers: {
    //             'Authorization': 'Bearer ' + access_token
    //         },
    //         type: "PUT"
    //     })
    // }, true);

    var app = new Vue({
        el: '#media-body',
        data: {
          currStamp: 'Hello Vue!'
        }
      })

    function toTimeFormat(seconds) {
        let m = Math.floor(seconds / 60);
        let s = Math.floor(seconds % 60);
        if (s < 10) {
            s = '0' + s;
        }
        return (m + ":" + s);
    }

setInterval(function () {
    $.ajax({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        type: "GET",
        success: function (response) {

            let numArtists = response.item.artists.length;
            let artistsGroup = response.item.artists[0].name;

            if (numArtists > 1) {
                for (i = 1; i < numArtists; i++) {
                    artistsGroup += ", " + response.item.artists[i].name
                }
            }

            //setting artist(s) names
            document.getElementById('artist').innerHTML = (artistsGroup);

            //setting song title
            let songTitle = response.item.name;
            const maxChar = 54;
            if (songTitle.length > maxChar) {
                document.getElementById('title').innerHTML = `${songTitle.substring(0, maxChar)}...`;
            }

            else {
                document.getElementById('title').innerHTML = songTitle;
            }

            //setting album art
            let albumURL = response.item.album.images[0].url;
            document.getElementById("albumArt").src = albumURL;

            const colorThief = new ColorThief();
            const img = new Image();

            img.addEventListener('load', function () {
                let mainColour = colorThief.getColor(img);
                document.getElementById('listener').style.backgroundColor = `rgb(${mainColour[0]},${mainColour[1]},${mainColour[2]})`;
            });

            let imageURL = albumURL;
            let googleProxyURL = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=';

            img.crossOrigin = 'Anonymous';
            img.src = googleProxyURL + encodeURIComponent(imageURL);



            //creating timestamps
            let currStamp = response.progress_ms / 1000;
            let totalStamp = response.item.duration_ms / 1000;
            document.getElementById("timestamp").innerHTML = toTimeFormat(currStamp) + " / " + toTimeFormat(totalStamp);

            //creating progress bar
            document.getElementById("progressLength").style.width = (currStamp * 100 / totalStamp) + '%';

            //boolean that sees if the song is currently playing
            let is_playing = response.is_playing;

            //showing wether the song is explicit or not
            let is_explicit = response.item.explicit;

            if (is_explicit) {
                document.getElementById('explicit').style.visibility = 'visible';
            }
            else {
                document.getElementById('explicit').style.visibility = 'hidden';
            }
        }
    });
}, 500);
