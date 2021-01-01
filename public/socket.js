// function getHashParams() {
//     var hashParams = {};
//     var e, r = /([^&;=]+)=?([^&;]*)/g,
//         q = window.location.hash.substring(1);
//     while (e = r.exec(q)) {
//         hashParams[e[1]] = decodeURIComponent(e[2]);
//     }
//     return hashParams;
// }

const socket = io();
const myPath = document.location.pathname.slice(1);

let user = {
    name: 'Jagvir',
    id: '48asdasasdasdad',
    image: "https://i.scdn.co/image/ab67616d0000b27398e08f603553915a041b6937",
    room: myPath,
}

console.log(`path: ${myPath}`);

if (myPath === '') {
    socket.emit('create-room', user);
} else {
    socket.emit('join-room', user);
}

socket.on('message', (msg) => {
    console.log(msg);
});

socket.on('redirect', (url) => {
    if (document.location.pathname !== url.path)
        document.location.href = url.path;
});
