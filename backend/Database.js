const { MongoClient, ObjectId } = require('mongodb');

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

  Database.prototype.getRoom = async function(room_id) {
    const db = await this.connected;
    try {
      const _id = ObjectId.isValid(room_id) ? new ObjectId(room_id) : room_id;
      const room = await db.collection('chatrooms').findOne({ _id: _id });
      if (!room) return null;
      return { ...room, _id: room._id.toString() };
    } catch (error) {
      console.error("Error fetching the room from MongoDB:", error);
      throw error; 
    }
  }
  
  Database.prototype.addRoom = async function(room) {
    const db = await this.connected;
    if (!room.name) {
      throw new Error("The name field is required.");
    }
    try {
      const result = await db.collection('chatrooms').insertOne(room);
      const insertedDocument = await db.collection('chatrooms').findOne({_id: result.insertedId});
      console.log("Insert operation result:", insertedDocument);
      return insertedDocument;
    } catch (error) {
      throw error;
    }
  }  
}

Database.prototype.getRooms = function () {
  return this.connected.then(db =>
    new Promise((resolve, reject) => {
      var chatrooms = db.collection("chatrooms").find({});
      resolve(chatrooms.toArray());
    })
  )
}

Database.prototype.getLastConversation = function (room_id, before = Date.now()) {
  return this.connected.then(db =>
    db.collection("conversations").find({ room_id: room_id, timestamp: { $lt: before } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray()
      .then(conversations => {
        if (conversations.length === 0) {
          return null;
        } else {
          return conversations[0];
        }
      })
  );
}; 

Database.prototype.addConversation = function (conversation) {
  return this.connected.then(db =>
    new Promise((resolve, reject) => {
      if (!conversation.room_id || !conversation.timestamp || !conversation.messages) {
        reject(new Error("All fields (room_id, timestamp, messages) are required."));
        return;
      }
      db.collection("conversations").insertOne(conversation)
        .then(result => {
          db.collection("conversations").findOne({ _id: result.insertedId })
            .then(insertedConversation => {
              resolve(insertedConversation);
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    })
  );
};

Database.prototype.getUser = async function(username) {
  const db = await this.connected;
  try {
    const user = await db.collection('users').findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    console.log("Database getUser result:", user); 
    if (!user) return null;
    return user;
  } catch (error) {
    console.error("Error fetching user from MongoDB:", error);
    throw error;
  }
}

module.exports = Database;
