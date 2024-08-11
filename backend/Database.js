/**
 * Database.js
 * 
 * This file defines the Database class which handles database operations using MongoDB.
 * It provides methods for connecting to the database, fetching rooms, adding rooms, fetching conversations, and more.
 * 
 * Methods:
 * - constructor: Initializes the database connection.
 * - getRoom: Fetches a specific room by its ID.
 * - addRoom: Adds a new room to the database.
 * - getRooms: Fetches all rooms.
 * - getLastConversation: Fetches the last conversation for a specific room.
 * - addConversation: Adds a new conversation or updates the last one if within a short timeframe.
 * - getUser: Fetches a user by username.
 * 
 * Dependencies:
 * - MongoClient: MongoDB client for connecting to the database.
 * - ObjectId: MongoDB ObjectId for handling document IDs.
 * 
 * Connected Files:
 * - This module is imported and used in server.js for database operations.
 * 
 * Usage:
 * Create an instance of the Database class and use its methods to interact with the MongoDB database.
 */

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

Database.prototype.addConversation = async function (conversation) {
  const db = await this.connected;
  try {
    // Check if a conversation exists with the same room_id and within a short timeframe
    const lastConversation = await db.collection("conversations")
      .find({ room_id: conversation.room_id })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (lastConversation.length > 0 && (new Date().getTime() - lastConversation[0].timestamp) < 30000) { // 30 seconds to consider part of the same conversation
      // Append to existing conversation
      db.collection("conversations").updateOne(
        { _id: lastConversation[0]._id },
        { $push: { messages: { $each: conversation.messages } }, $set: { timestamp: new Date().getTime() } }
      );
    } else {
      // Create a new conversation
      await db.collection("conversations").insertOne(conversation);
    }
  } catch (error) {
    console.error("Error updating or adding conversation:", error);
    throw error;
  }
};

Database.prototype.getUser = async function(username) {
  const db = await this.connected;
  try {
    const user = await db.collection('defaultanswers').findOne({ teamName: { $regex: new RegExp(`^${username}$`, 'i') } });
    console.log("Database getUser result:", user); 
    if (!user) return null;
    return user;
  } catch (error) {
    console.error("Error fetching user from MongoDB:", error);
    throw error;
  }
}

Database.prototype.getRandomHockeyWordleAnswer = async function() {
  const db = await this.connected;
  try {
      const count = await db.collection('defaultanswers').countDocuments();
      console.log('Number of answers in HockeyWordleAnswers:', count);

      if (count === 0) {
          console.error('No answers found in HockeyWordleAnswers collection.');
          return null;
      }

      const randomIndex = Math.floor(Math.random() * count);
      console.log('Random index selected:', randomIndex);

      const randomEntry = await db.collection('defaultanswers').find().skip(randomIndex).limit(1).toArray();
      console.log('Random entry fetched:', randomEntry);

      return randomEntry[0];
  } catch (error) {
      console.error("Error fetching random HockeyWordleAnswer from MongoDB:", error);
      throw error;
  }
};



module.exports = Database;
