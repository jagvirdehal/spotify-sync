const UserMap = require('./usermap.js');

class Lobby {
    rooms = {}
    hosts = {}

    create(room, hostId) {
        this.rooms[room] = [hostId];
        this.hosts[room] = hostId;
    }

    join(room, userId) {
        if (this.rooms[room] && !this.inRoom(room, userId)) {
            this.rooms[room].push(userId);
            return false;
        } else if (!this.rooms[room]) {
            return true; // True if error
        }
        return false;
    }

    clean(room) {
        if (this.rooms[room]) {
            this.rooms[room].forEach((member, index) => {
                if (userMap.getRoom(member) !== room)
                    this.rooms[room].pop(index);
            });
        }

        if (this.hosts[room] && !this.inRoom(room, this.hosts[room])) {
            this.remove(room);
        }
    }

    inRoom(room, userId) {
        if (!this.rooms[room]) {
            return false
        }

        for (let i = 0; i < this.rooms[room].length; i++) {
            let member = this.rooms[room][i];
            if (userId === member) {
                return true;
            }
        }

        return false;
    }

    remove(room) {
        if (this.rooms[room])
            delete this.rooms[room]
        if (this.hosts[room])
            delete this.hosts[room]
    }

    getHost(room) {
        if (this.hosts[room])
            return this.hosts[room]
        else
            return null;
    }

    getListeners(room) {
        if (this.rooms[room])
            return this.rooms[room];
        else
            return null;
    }
};

const userMap = new UserMap();
const lobby = new Lobby();

module.exports = [lobby, userMap];
