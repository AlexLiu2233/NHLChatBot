const { MongoClient, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v6.3 - [API Documentation](http://mongodb.github.io/node-mongodb-native/6.3/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
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

// Retrieve room from room_id
Database.prototype.getRoom = function (room_id) {
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			try {
				// Convert from string to ObjectId (Mongo)
				room_id = ObjectId(room_id);
			} catch (err) {
				console.log("Invalid object ID")
			}
			// Find one chatroom with the matching _id in the database and resolve the promise with it
			resolve(db.collection("chatrooms").findOne({ _id: room_id }));
		})
	)
}

// Retrieves all rooms in Database
Database.prototype.getRooms = function(){
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
	  if (!room.name) {
		return Promise.reject(new Error("Room name is required."));
	  }
  
	  // Create a new Promise for the insert operation
	  return new Promise((resolve, reject) => {
		db.collection("chatrooms").insertOne(room)
		  .then(result => {
			if (result.insertedId) {
			  room._id = result.insertedId; // Set the _id of the room object to the insertedId
			  resolve(room); // Resolve with the updated room object
			} else {
			  reject(new Error("Room insertion did not return an insertedId."));
			}
		  })
		  .catch(reject); // If an error occurs during insertion, pass it to the reject function
	  });
	});
  };
  
  
  
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