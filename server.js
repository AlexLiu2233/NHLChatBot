// NPM ws module
const WebSocket = require('ws');

// WebSocket server that listens on a different port
const broker = new WebSocket.Server({ port: 8000 });

const Database = require('./Database.js')
const db = new Database('mongodb://127.0.0.1:27017', 'cpen322-messenger');



// WebSocket functionality to act as "message broker"
broker.on('connection', function connection(ws) {
	ws.binaryType = 'arraybuffer'; // on the client side
	ws.on('message', function incoming(message) {

		// Convert Buffer messages into string
		if (message instanceof Buffer) {
			message = message.toString();
		}

		try {
			// Assuming `message` should be a stringified JSON, otherwise it will throw an error.
			const parsedMessage = JSON.parse(message.toString());

			// Iterate through all clients and broadcast the message
			broker.clients.forEach(function each(client) {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(message);
				}
			});


			// Add the message to the 'messages' object for the room
			if (messages[parsedMessage.roomId]) {
				messages[parsedMessage.roomId].push(parsedMessage);
			}
		} catch (e) {
			console.error("Error parsing message", e);
		}
	});
});


const path = require('path');
const fs = require('fs');
const express = require('express');

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


// express app
let app = express();

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

// POST endpoint for creating a new chatroom
app.post('/chat', (req, res) => {
	const newRoom = req.body; // Assume the new room's details are sent in the request body
	if (!newRoom.name || !newRoom.image) {
	  // If required fields are missing, send an HTTP 400 Bad Request response
	  return res.status(400).send('Malformed request, name and image are required.');
	}
  
	db.addRoom(newRoom).then(addedRoom => {
	  // Add an entry to the messages object for the new room
	  messages[addedRoom._id] = [];
	  // Send the added room as the response
	  res.status(201).json(addedRoom);
	}).catch(err => {
	  console.error(err);
	  // If there's an error adding the room, send an HTTP 500 Internal Server Error response
	  res.status(500).send('Internal Server Error');
	});
  });


cpen322.connect('http://3.98.223.41/cpen322/test-a4-server.js');
cpen322.export(__filename, { app, chatrooms, messages, broker, db });