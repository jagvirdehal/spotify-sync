// Cookie keys
const loggedInKey = 'logged_in';
const accessTokenKey = 'access_token';
const refreshTokenKey = 'refresh_token';
const expiresInKey = 'expires_in';
const issueTimeKey = 'issue_time';

const REFRESH_BUFFER = 60;

let display_name_temp;
let currStamptemp;
let totalStampTemp;
let albumURLTemp;
let artistsGroupTemp;
let songTitleTemp;
let colorThiefAlbumTemp;
let progressLengthTemp;
let visibleTemp;



var app = new Vue({
    el: '.container',
    data: {
        display_name: 'John Appleseed',
        currStamp: '00',
        totalStamp: '00',
        albumURL:'https://images.homedepot-static.com/catalog/productImages/300/5c/5c5fed4a-8e18-4942-b3a7-bf58f4e55243_300.jpg',
        artistsGroup: '~Please~',
        songTitle: '~Play a Song~',
        colorThiefAlbum: 'background-color: rgb(255, 0, 0)',
        progressLength: 'width: 0%',
        users: [],
        visible: false
    },
    methods: {
        update: function(event) {
            app.colorThiefAlbum = colorThiefAlbumTemp;
            app.display_name = display_name_temp;
            app.currStamp = currStampTemp;
            app.totalStamp = totalStampTemp;
            app.albumURL = albumURLTemp;
            app.artistsGroup = artistsGroupTemp;
            app.songTitle = songTitleTemp;
            app.progressLength = progressLengthTemp;
            app.visible = visibleTemp;   
           
        
            
        }
    }
  })
  
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
            display_name_temp = response.display_name;
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
            
            //setting artist(s) names
            let numArtists = response.item.artists.length;
            let artistsGroup = response.item.artists[0].name;

            if (numArtists > 1) {
                for (i = 1; i < numArtists; i++) {
                    artistsGroup += ", " + response.item.artists[i].name
                }
            }
            artistsGroupTemp = (artistsGroup);

            //setting song title
            let songTitle = response.item.name;
            const maxChar = 54;
            if (songTitle.length > maxChar) {
                songTitleTemp = `${songTitle.substring(0, maxChar)}...`;
            }

            else {
                songTitleTemp = songTitle;
            }

            //setting album art
            let albumURL = response.item.album.images[0].url;
            albumURLTemp = albumURL;

            const colorThief = new ColorThief();
            const img = new Image();

            img.addEventListener('load', function () {
                let mainColour = colorThief.getColor(img);
                colorThiefAlbumTemp = `background-color: rgb(${mainColour[0]},${mainColour[1]},${mainColour[2]})`;
                
            });

            let imageURL = albumURL;
            let googleProxyURL = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=';

            img.crossOrigin = 'Anonymous';
            img.src = googleProxyURL + encodeURIComponent(imageURL);



            //creating timestamps
            let currStamp = response.progress_ms / 1000;
            let totalStamp = response.item.duration_ms / 1000;
            
            currStampTemp = toTimeFormat(currStamp);
            totalStampTemp = toTimeFormat(totalStamp);
        

            //creating progress bar
            progressLengthTemp = `width: ${(currStamp * 100 / totalStamp)}%`;

            //boolean that sees if the song is currently playing
            let is_playing = response.is_playing;

            //showing wether the song is explicit or not
            visibleTemp = response.item.explicit;

            app.update();

        }
    });
}, 500);
