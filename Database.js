const { MongoClient, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v6.3 - [API Documentation](http://mongodb.github.io/node-mongodb-native/6.3/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName) {
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		const client = new MongoClient(mongoUrl);

		client.connect()
			.then(() => {
				console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
				resolve(client.db(dbName));
			}, reject);
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRoom = function (room_id) {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            db.collection("chatrooms").findOne({ _id: room_id })
                .then(room => {
                    if (room) {
                        resolve(room); // Room found, resolve with the room object
                    } else {
                        resolve(null); // No room found, resolve with null
                    }
                })
                .catch(reject); // Actual error, reject the promise
        })
    );
};


// Retrieves all rooms in Database
Database.prototype.getRooms = function () {
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			// Get a cursor to all documents in the "chatrooms" collectio
			var chatrooms = db.collection("chatrooms").find({});
			// Convert the cursor to an array and resolve the promise with the array of chatrooms
			resolve(chatrooms.toArray());
		})
	)
}

Database.prototype.addRoom = function (room) {
    return this.connected.then(db => {
        // Check if the room name is provided
        if (!room.name) {
            return Promise.reject(new Error("Room name is required."));
        }

        // Insert the room into the "chatrooms" collection
        return new Promise((resolve, reject) => {
            db.collection("chatrooms").insertOne(room)
                .then(result => {
                    // Fetch the newly inserted document using the insertedId
                    db.collection("chatrooms").findOne({ _id: result.insertedId })
                        .then(insertedRoom => {
                            if (insertedRoom) {
                                resolve(insertedRoom); // Resolve with the newly added room object
                            } else {
                                reject(new Error("Failed to retrieve the newly added room."));
                            }
                        })
                        .catch(error => reject(error));
                })
                .catch(error => reject(error));
        });
    });
};

Database.prototype.getLastConversation = function (room_id, before = Date.now()) {
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			// Find the latest conversation with timestamp less than `before`
			db.collection("conversations").find({ room_id: room_id, timestamp: { $lt: before } })
				.sort({ timestamp: -1 }) // Sort by timestamp in descending order to get the latest conversation
				.limit(1) // Only fetch the latest (one) conversation
				.toArray() // Convert the find result to an array
				.then(conversations => {
					if (conversations.length === 0) {
						resolve(null); // Resolve with null if no conversations were found
					} else {
						resolve(conversations[0]); // Resolve with the found conversation
					}
				})
				.catch(reject); // Reject promise if there's an error
		})
	);
};

Database.prototype.addConversation = function (conversation) {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            // Check if all required fields are present
            if (!conversation.room_id || !conversation.timestamp || !conversation.messages) {
                reject(new Error("All fields (room_id, timestamp, messages) are required."));
                return;
            }

            // Insert conversation into the "conversations" collection
            db.collection("conversations").insertOne(conversation)
                .then(result => {
                    // Assuming `result.insertedId` contains the ID of the newly inserted document
                    // Fetch the newly inserted document using the insertedId
                    db.collection("conversations").findOne({ _id: result.insertedId })
                        .then(insertedConversation => {
                            if (insertedConversation) {
                                resolve(insertedConversation);
                            } else {
                                reject(new Error("Failed to retrieve the newly added conversation."));
                            }
                        })
                        .catch(error => reject(error));
                })
                .catch(error => reject(error));
        })
    );
};



module.exports = Database;