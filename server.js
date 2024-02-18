// NPM ws module
const WebSocket = require('ws');

// WebSocket server that listens on a different port
const broker = new WebSocket.Server({ port: 8000 });

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
chatrooms.forEach(room => {
	messages[room.id] = []; // initialize an empty array for each room
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
	let chatDetails = chatrooms.map(room => {
		return {
			id: room.id,
			name: room.name,
			image: room.image,
			messages: messages[room.id] // attach messages corresponding to the room id
		};
	});
	res.json(chatDetails);
});

// POST endpoint for creating a new chatroom
app.post('/chat', (req, res) => {
	const data = req.body;
	if (!data.name) {
		// If name field is not present, send a 400 error
		res.status(400).send('Name field is required');
	} else {
		// Create a new room with a unique ID
		const newRoom = {
			id: generateUniqueId(),
			name: data.name,
			image: data.image,
			messages: []
		};

		// Add the new room to the chatrooms array
		chatrooms.push(newRoom);

		// Initialize an empty message array for the new room
		messages[newRoom.id] = [];

		// Send the new room back as the response
		res.status(200).json(newRoom);
	}
});


cpen322.connect('http://3.98.223.41/cpen322/test-a3-server.js');
cpen322.export(__filename, { app, chatrooms, messages, broker });