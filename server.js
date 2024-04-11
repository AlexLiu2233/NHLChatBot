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
const axios = require('axios'); // Add this at the top with other require statements

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

const generateText = async (prompt, model = "Nous-Hermes-2-Mistral-7B-DPO.Q4_0") => {
    const apiBase = "http://localhost:4891/v1";
    const requestData = {
        model: model,
        prompt: prompt,
        max_tokens: 50,
        temperature: 0.28,
        top_p: 0.95,
        n: 1,
        echo: true,
        stream: false
    };

    console.log(`Sending request: ${JSON.stringify(requestData)}`);

    try {
        const response = await axios.post(`${apiBase}/completions`, requestData);
        console.log("generateText: ",response.data.choices[0].text)
        return response.data.choices[0].text;
    } catch (error) {
        console.error(`Error in request: ${error}`);
        return null;
    }
};

// Modify the /api/generate-text route handler
app.post('/api/generate-text', async (req, res) => {
    const { prompt } = req.body;
    const roomId = req.params.room_id;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    const generatedText = await generateText(prompt);
    if (generatedText) {
        console.log("From Server - generated text: ", generatedText)
        res.json({ generatedText , id: roomId});
    } else {
        res.status(500).json({ error: 'Failed to generate text.' });
    }
});

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

app.get('/chat/:room_id/messages', protectRoute, (req, res) => {
    const roomId = req.params.room_id;
    const before = req.query.before ? parseInt(req.query.before, 10) : Date.now();

    db.getLastConversation(roomId, before)
        .then(conversation => {
            if (conversation) {
                res.json(conversation);
            } else {
                res.json({ messages: [] }); // empty
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error fetching conversation');
        });
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

app.get('/api/generate-player', async (req, res) => {
    const prompt = "Generate a random NHL player name.";
    const playerName = await generateText(prompt);
    if (playerName) {
        res.json({ playerName });
    } else {
        res.status(500).json({ error: 'Failed to generate player name.' });
    }
});

// POST endpoint for creating a new chatroom
app.post('/chat', protectRoute, (req, res) => {
	var result = req.body;
		if (!result["name"]) {
			res.status(400).send("data does not have a name field");
		} else {
			tmp_id = Math.random() + "";
			var tmp_room = {
				"name": result["name"],
				"image": result["image"],
			};
			messages[tmp_id] = [];
			db.addRoom(tmp_room)
                .then((insertedRoom) => {
                    messages[insertedRoom._id.toString()] = [];
                    res.status(200).send(JSON.stringify(insertedRoom));
            });
		}
  });

app.get('/profile', protectRoute, (req, res) => {
    // Assuming the session middleware adds a username to the request object
    if (req.username) {
        res.json({ username: req.username });
    } else {
        // This case should ideally never happen due to the protectRoute middleware
        res.status(404).send('User not found');
    }
});

// Secure static file serving with session validation
app.get('/app.js', protectRoute, (req, res) => {
    res.sendFile(path.join(clientApp, 'app.js'));
});

app.get(['/index', '/index.html', '/'], protectRoute, (req, res) => {
    res.sendFile(path.join(clientApp, 'index.html'));
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

app.get('/logout', (req, res) => {
    // Deletes the session associated with the request
    sessionManager.deleteSession(req);
    // Clear the session cookie from the client
    res.clearCookie('cpen322-session');
    // Redirect the user to the login page
    res.redirect('/login');
});


// Static files accessible without authentication
app.use(express.static(clientApp, { extensions: ['html'] }));

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
// Middleware to protect WebSocket connections
broker.on('connection', (ws, req) => {
    try {
        const cookieString = req.headers.cookie;
        const cookies = cookieString.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            acc[key] = value;
            return acc;
        }, {});

        const sessionToken = cookies['cpen322-session'];
        if (!sessionManager.getUsername(sessionToken)) {
            console.log('Invalid session token. Closing WebSocket connection.');
            ws.close(); // Close connection if session is invalid
            return;
        }

        ws.username = sessionManager.getUsername(sessionToken); // Store username in WebSocket object
    } catch (error) {
        console.error('Error during WebSocket connection:', error);
        ws.close();
    }
    
	ws.on('message', async (message) => {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
            console.log("Parsed Message: ", parsedMessage)
            
            // Sanitize the message text by escaping HTML special characters
            parsedMessage.text = parsedMessage.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
            parsedMessage.username = ws.username; // Overwrite username with the one from session, ensure message safety
    
            // Check if the sanitized message starts with '#AI'
            if (parsedMessage.text.startsWith('#AI')) {
                const aiPrompt = parsedMessage.text.slice(3); // Remove '#AI' prefix
                const aiResponse = await generateText(aiPrompt); // Generate AI response
    
                // Prepare the AI response as a new message
                const aiMessage = {
                    username: "AI", // Customize the AI username as needed
                    text: aiResponse,
                    roomId: parsedMessage.roomId
                };
    
                // Convert AI message to JSON string for broadcasting
                const forwardAIMessage = JSON.stringify(aiMessage);
    
                // Broadcast AI message to all connected clients
                broker.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(forwardAIMessage);
                    }
                });
            } else {
                // If not an AI prompt, broadcast the original sanitized message
                const forwardMessage = JSON.stringify(parsedMessage);
                broker.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(forwardMessage);
                    }
                });
            }
        } catch (e) {
            console.error("Error parsing or handling message", e);
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



cpen322.connect('http://3.98.223.41/cpen322/test-a4-server.js');
cpen322.export(__filename, { app, messages, db, messageBlockSize, sessionManager, isCorrectPassword });