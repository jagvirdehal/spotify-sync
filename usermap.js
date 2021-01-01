class UserMap {
    users = {}

    add(user) {
        this.users[user.id] = user;
    }

    remove (user) {
        if (this.users[user.id])
            delete this.users[user.id];
    }

    get (id) {
        if (this.users[id])
            return this.users[id]
        else
            return null
    }

    getRoom (id) {
        if (this.users[id])
            return this.users[id].room
        else
            return null
    }

    setRoom (id, room) {
        if (this.users[id]) {
            this.users[id].room = room;
        }
    }
};

module.exports = UserMap;
