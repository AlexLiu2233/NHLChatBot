const express = require('express');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const sessionManager = new SessionManager();
const app = express();
const db = new Database('mongodb://127.0.0.1:27017', 'cpen322-messenger');
const broker = new WebSocket.Server({ port: 8000 });
const messageBlockSize = 10;
const protectRoute = sessionManager.middleware;
const clientApp = path.join(__dirname, 'client');
let messages = {};
const cpen322 = require('./cpen322-tester.js');

// Express Server
const host = 'localhost';
const port = 3000;

// Call getRooms from the Database instance and initialize messages
db.getRooms().then(rooms => {
	rooms.forEach(room => {
		messages[room._id.toString()] = []; // Initialize an empty array for each room using the _id field
	});
}).catch(err => {
	console.error('Error initializing rooms:', err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);	

// Static files accessible without authentication
app.use(express.static(clientApp, { extensions: ['html'] }));

// Login route definition
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.getUser(username);
        if (!user) {
            return res.redirect('/login'); // User not found
        }
        
        // Ensure isCorrectPassword is awaited if it's async
        const passwordMatches = await isCorrectPassword(password, user.password);
        if (passwordMatches) {
            sessionManager.createSession(res, username);
            return res.redirect('/'); // Authentication successful
        } else {
            return res.redirect('/login'); // Authentication failed
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error on /login POST');
    }
});


app.get('/chat', protectRoute, (req, res) => {
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
app.post('/chat', protectRoute, (req, res) => {
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

app.get('/chat/:room_id', protectRoute, (req, res) => {
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

app.get('/chat/:room_id/messages', protectRoute, (req, res) => {
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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.getUser(username);
        if (!user) {
            return res.redirect('/login'); // User not found
        }
        
        // Ensure isCorrectPassword is awaited if it's async
        const passwordMatches = await isCorrectPassword(password, user.password);
        if (passwordMatches) {
            sessionManager.createSession(res, username);
            return res.redirect('/'); // Authentication successful
        } else {
            return res.redirect('/login'); // Authentication failed
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error on /login POST');
    }
});

// Secure static file serving with session validation
app.get('/app.js', protectRoute, (req, res) => {
    res.sendFile(path.join(clientApp, 'app.js'));
});

app.get(['/index', '/index.html', '/'], protectRoute, (req, res) => {
    res.sendFile(path.join(clientApp, 'index.html'));
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

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

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

function logRequest(req, res, next) {
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}


async function isCorrectPassword(password, saltedHash) {
    const salt = saltedHash.substring(0, 20);
    const originalHash = saltedHash.substring(20);
    const hash = crypto.createHash('sha256').update(password + salt).digest('base64');
    return originalHash === hash;
}



cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, messages, db, messageBlockSize, sessionManager, isCorrectPassword });