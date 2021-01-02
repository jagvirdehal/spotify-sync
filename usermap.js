class UserMap {
    users = new Map()       // userId -> userinfo object
    sockets = new Map()     // userId -> set of socketIds

    add (user) {
        this.users.set(user.id, user);
    }

    addSocket (userId, socketId) {
        if (!this.sockets.has(userId)) {
            this.sockets.set(userId, new Set());
        }

        this.sockets.get(userId).add(socketId);
    }
    
    remove (userId) {
        this.users.delete(userId);
        this.sockets.delete(userId);
    }

    removeSocket (userId, socketId) {
        if (this.sockets.has(userId)) {
            this.sockets.get(userId).delete(socketId);
        }
    }

    get (userId) {
        if (this.users.has(userId))
            return this.users.get(userId);
        else
            return null
    }

    getRoom (userId) {
        if (this.users.has(userId))
            return this.users.get(userId).room
        else
            return null
    }

    getSockets (userId) {
        if (this.sockets.has(userId))
            return this.sockets.get(userId);
        else
            return null
    }

    setRoom (userId, room) {
        if (this.users.has(userId)) {
            this.users.get(userId).room = room;
        }
    }
};

module.exports = UserMap;
