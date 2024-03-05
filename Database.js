const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v4.2+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/4.2/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
    function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function() {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            db.collection('chatrooms').find().toArray((err, rooms) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rooms);
                }
            });
        })
    );
};


Database.prototype.getRoom = function(room_id) {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            // Attempt to convert room_id to MongoDB ObjectID
            let objectId;
            try {
                objectId = new ObjectID(room_id);
            } catch {
                objectId = room_id; // If conversion fails, use original room_id
            }

            // Query the database for the room with the given ID
            db.collection('chatrooms').findOne({ _id: objectId }, (err, room) => {
                if (err) {
                    reject(err); // If there's an error, reject the promise
                } else {
                    resolve(room); // If the query is successful, resolve with the room (or null if not found)
                }
            });
        })
    );
};


Database.prototype.addRoom = function(room){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
		})
	)
}

module.exports = Database;