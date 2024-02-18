const path = require('path');
const fs = require('fs');
const express = require('express');

const cpen322 = require('./cpen322-tester.js');

function logRequest(req, res, next) {
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

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
  

cpen322.connect('http://3.98.223.41/cpen322/test-a3-server.js');
cpen322.export(__filename, { app, chatrooms, messages });