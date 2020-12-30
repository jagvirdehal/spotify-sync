(function () {

    /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while (e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }

    var userProfileSource = document.getElementById('user-profile-template').innerHTML,
        userProfileTemplate = Handlebars.compile(userProfileSource),
        userProfilePlaceholder = document.getElementById('user-profile');

    var oauthSource = document.getElementById('oauth-template').innerHTML,
        oauthTemplate = Handlebars.compile(oauthSource),
        oauthPlaceholder = document.getElementById('oauth');

    var params = getHashParams();

    var access_token = params.access_token,
        refresh_token = params.refresh_token,
        error = params.error;

    if (error) {
        alert('There was an error during the authentication');
    } else {
        if (access_token) {
            // render oauth info
            oauthPlaceholder.innerHTML = oauthTemplate({
                access_token: access_token,
                refresh_token: refresh_token
            });

            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (response) {
                    userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                    
                    $('#login').hide();
                    $('#loggedin').show();
                }
            });
            
            
            
            
        } else {
            // render initial screen
            $('#login').show();
            $('#loggedin').hide();
        }
        
        document.getElementById('obtain-new-token').addEventListener('click', function () {
            $.ajax({
                url: '/refresh_token',
                data: {
                    'refresh_token': refresh_token
                }
            }).done(function (data) {
                access_token = data.access_token;
                oauthPlaceholder.innerHTML = oauthTemplate({
                    access_token: access_token,
                    refresh_token: refresh_token
                });
            });
        }, false);
        
        // document.getElementById('obtain-new-token').addEventListener('click', function () {
            //     $.ajax({
                //         url: 'https://api.spotify.com/v1/me/player/pause',
                //         headers: {
                    //             'Authorization': 'Bearer ' + access_token
                    //         },
                    //         type: "PUT"
                    //     })
                    // }, true);
                    
                    //// receive user's initial playback state
                    // $.ajax({
                    //     url: 'https://api.spotify.com/v1/me/player',
                    //     headers: {
                    //         'Authorization': 'Bearer ' + access_token
                    //     },
                    //     type: "GET",
                    //     success: function (response) {
                    //         document.getElementById("h1").innerHTML = (response.item.album.name);
                    //     }
                    // });
                    function toTimeForamt(seconds){
                        let m = Math.floor(seconds / 60);
                        let s = Math.floor(seconds % 60);
                        if(s < 10){
                            s = '0' + s;
                        }
                        return(m + ":" + s);
                    }

                    setInterval(function(){ 
                        $.ajax({
                            url: 'https://api.spotify.com/v1/me/player/currently-playing',
                            headers: {
                                'Authorization': 'Bearer ' + access_token
                            },
                            type: "GET",
                            success: function (response) {
                                
                                let numArtists = response.item.artists.length;
                                let artistsGroup = response.item.artists[0].name;
                                
                                if(numArtists > 1){
                                    for(i = 1; i < numArtists; i++){ 
                                        artistsGroup += ", " + response.item.artists[i].name
                                    }
                                }

                                //setting artist(s) names
                                document.getElementById('artist').innerHTML = (artistsGroup);

                                //setting song title
                                document.getElementById('title').innerHTML = (response.item.name);
                                
                                //setting album art
                                document.getElementById("albumArt").src = response.item.album.images[0].url;
                                
                                //creating timestamps
                                let currStamp = response.progress_ms/1000;
                                let totalStamp = response.item.duration_ms/1000;
                                document.getElementById("timestamp").innerHTML = toTimeForamt(currStamp) + " / " + toTimeForamt(totalStamp);

                                //boolean that sees if the song is currently playing
                                let is_playing = response.is_playing;

                                //showing wether the song is explicit or not
                                let is_explicit = response.item.explicit;
                                
                                if(is_explicit){
                                    document.getElementById('explicit').style.visibility = 'visible';
                                }
                                else{
                                    document.getElementById('explicit').style.visibility = 'hidden';
                                }

                            }
                        });
                    }, 500);

                   
                   
    }
})();
