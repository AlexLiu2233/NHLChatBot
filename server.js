// NPM ws module
const WebSocket = require('ws');

// WebSocket server that listens on a different port
const broker = new WebSocket.Server({ port: 8000 });

const Database = require('./Database.js')
const db = new Database('mongodb://127.0.0.1:27017', 'cpen322-messenger');

const messageBlockSize = 10;

const SessionManager = require('./SessionManager.js')
const sessionManager = new SessionManager();

const protectRoute = sessionManager.middleware;

const crypto = require('crypto');

// WebSocket functionality to act as "message broker"
broker.on('connection', function connection(ws) {
	ws.binaryType = 'arraybuffer'; // on the client side
	ws.on('message', function incoming(message) {
		if (message instanceof Buffer) {
			message = message.toString();
		}
	
		try {
			const parsedMessage = JSON.parse(message);
	
			// Broadcast the message to all connected clients
			broker.clients.forEach(function each(client) {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(message);
				}
			});
	
			// Initialize messages array for the room if it doesn't exist
			if (!messages[parsedMessage.roomId]) {
				messages[parsedMessage.roomId] = [];
			}
	
			// Add the new message to the room's messages array
			messages[parsedMessage.roomId].push(parsedMessage);
	
			// Check if the messages array has reached the messageBlockSize
			if (messages[parsedMessage.roomId].length === messageBlockSize) {
				// Create a new conversation object
				const newConversation = {
					room_id: parsedMessage.roomId,
					timestamp: Date.now(),
					messages: messages[parsedMessage.roomId]
				};
	
				// Add the new conversation to the database
				db.addConversation(newConversation).then(() => {
					// Reset the messages array for the room
					messages[parsedMessage.roomId] = [];
				}).catch(err => {
					console.error('Error saving conversation to database:', err);
				});
			}
		} catch (e) {
			console.error("Error parsing message", e);
		}
	});
});

const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
app.use(express.json());

const cpen322 = require('./cpen322-tester.js');

function logRequest(req, res, next) {
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

// Express Server
const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

let chatrooms = [
	{ id: "room1", name: "Chat Room 1", image: "image1.png" },
	{ id: "room2", name: "Chat Room 2", image: "image2.png" }
	// add as many rooms as needed
];

let messages = {};

// Call getRooms from the Database instance and initialize messages
db.getRooms().then(rooms => {
	rooms.forEach(room => {
		messages[room._id.toString()] = []; // Initialize an empty array for each room using the _id field
	});
}).catch(err => {
	console.error('Error initializing rooms:', err);
});

function generateUniqueId() {
	return Math.random().toString(36).substr(2, 9); // Simple unique ID generator
}


app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

app.use((err, req, res, next) => {
    if (err instanceof SessionManager.Error) {
        if (req.headers.accept === 'application/json') {
            res.status(401).json({ error: err.message });
        } else {
            res.redirect('/login');
        }
    } else {
        console.error(err); // Log the error
        res.status(500).send("Internal Server Error");
    }
});


app.get('/chat', (req, res) => {
	// Fetch chat rooms from the database
	db.getRooms().then((rooms) => {
		if (rooms) {
			var tmp = [];
			for (var i = 0; i < rooms.length; i++) {
				var tmproom = { // obj with room info + messages, init from MongoDB
					"_id": rooms[i]._id,
					"name": rooms[i].name,
					"image": rooms[i].image,
					"messages": messages[rooms[i]._id]
				};
				tmp.push(tmproom);
			}
			res.json(tmp);
		}
	}).catch(err => {
		console.error(err);
		res.status(500).send('Error fetching chat rooms');
	});
});

// POST endpoint for creating a new chatroom
app.post('/chat', (req, res) => {
	var result = req.body;
		if (!result["name"]) {
			res.status(400).send("data does not have a name field");
		} else {
			tmp_id = Math.random() + "";
			var tmp_room = {
				"_id": tmp_id,
				"name": result["name"],
				"image": result["image"],
			};
			messages[tmp_id] = [];
			db.addRoom(tmp_room)
				.then((tmp_room) => {
					res.status(200).send(JSON.stringify(tmp_room));
				});
		}
  });

app.get('/chat/:room_id', (req, res) => {
	const roomId = req.params.room_id; // Get the room ID from the request parameters
	db.getRoom(roomId).then(room => {
		if (room) {
			res.json(room);
		} else {
			res.status(404).send(`Room ${roomId} was not found`);
		}
	}).catch(err => {
		res.status(500).send(`Error fetching room: ${err}`);
	});
});

app.get('/chat/:room_id/messages', (req, res) => {
    const roomId = req.params.room_id;
    const before = req.query.before ? parseInt(req.query.before, 10) : Date.now();

    db.getLastConversation(roomId, before)
        .then(conversation => {
            if (conversation) {
                res.json(conversation);
            } else {
                res.status(404).send('No conversation found');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error fetching conversation');
        });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.getUser(username).then(user => {
        if (!user) {
            return res.redirect('/login'); // User not found
        }
        if (isCorrectPassword(password, user.password)) {
            sessionManager.createSession(res, username);
            return res.redirect('/'); // Authentication successful
        } else {
            return res.redirect('/login'); // Authentication failed
        }
    }).catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
});

function isCorrectPassword(password, saltedHash) {
    const salt = saltedHash.substring(0, 20);
    const originalHash = saltedHash.substring(20);
    const hash = crypto.createHash('sha256').update(password + salt).digest('base64');
    return originalHash === hash;
}



cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, messages, db, messageBlockSize, sessionManager, isCorrectPassword });