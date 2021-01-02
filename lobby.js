const UserMap = require('./usermap.js');

class Lobby {
    rooms = new Map()       // Roomname -> set of userIds
    hosts = new Map()       // Roomname -> host's userId

    create(room, hostId) {
        this.rooms.set(room, new Set());
        this.rooms.get(room).add(hostId);

        this.hosts.set(room, hostId);
    }

    join(room, userId) {
        if (this.rooms.has(room)) {
            this.rooms.get(room).add(userId);
            return false;
        } else {
            return true;    // True if room does not exist
        }
    }

    leave(room, userId) {
        if (this.rooms.has(room)) {
            this.rooms.get(room).delete(userId);
        }
    }

    clean(room) {
        if (this.rooms.has(room)) {
            for (let member of this.rooms.get(room)) {
                if (userMap.getRoom(member) !== room)
                    this.rooms.get(room).delete(member);
            }
        }

        if (this.hosts.has(room) && !this.inRoom(room, this.hosts.get(room))) {
            this.remove(room);
        }
    }

    inRoom(room, userId) {
        return this.rooms.has(room) && this.rooms.get(room).has(userId);
    }

    remove(room) {
        this.rooms.delete(room);
        this.hosts.delete(room);
    }

    getHost(room) {
        if (this.hosts.has(room))
            return this.hosts.get(room)
        else
            return null;
    }

    getListeners(room) {
        if (this.rooms.has(room)) {
            return Array.from(this.rooms.get(room));
        } else {
            return null;
        }
    }
};

const userMap = new UserMap();
const lobby = new Lobby();

module.exports = [lobby, userMap];
