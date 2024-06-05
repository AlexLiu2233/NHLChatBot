const express = require('express');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const sessionManager = new SessionManager();
const { createCompletion, loadModel } = require('gpt4all');
const app = express();
const db = new Database('mongodb://127.0.0.1:27017', 'cpen322-messenger');
const broker = new WebSocket.Server({ port: 8000 });
const messageBlockSize = 10;
const protectRoute = sessionManager.middleware;
const clientApp = path.join(__dirname, 'client');
let messages = {};
const axios = require('axios'); // Add this at the top with other require statements

// Express Server
const host = 'localhost';
const port = 3000;

// Load the GPT4All model
const modelPromise = loadModel("mistral-7b-openorca.gguf2.Q4_0.gguf", {
    verbose: true,
    device: "gpu" // or 'cpu', depending on your setup
});

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

// Static middleware for images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

async function generateText(prompt) {
    try {
        const model = await modelPromise; // Ensure the model is loaded
        const response = await createCompletion(model, prompt);
        return response.choices[0].message; // Adjust according to the actual response structure
    } catch (error) {
        console.error('Error in generating text with GPT4All:', error);
        return null; // Handle errors appropriately
    }
}

app.post('/api/generate-player', async (req, res) => {
    const { keywords } = req.body;
    const prompt = `Please name a player who played in the National Hockey League and is a good fit for these: ${keywords}. Please ensure your response begins with the name.`;

    const generatedResponse = await generateText(prompt);

    if (generatedResponse && generatedResponse.content) {
        const generatedText = generatedResponse.content;

        // Extract the player's name by trimming the string and splitting it at spaces
        const playerName = generatedText.trim().split(/\s+/).slice(0, 2).join(' ');
        console.log("The playerName is: ", playerName)
        // If a valid player name is found, respond with it
        if (playerName) {
            res.json({ playerName });
        } else {
            // Handle cases where the model returns no name
            res.status(404).json({ error: 'No valid player name found in generated response.' });
        }
    } else {
        // Handle cases where the generated response is not valid or content is missing
        console.error('Error with generated response:', generatedResponse);
        res.status(500).json({ error: 'Failed to generate a valid player name. Please try again later.' });
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
    const prompt = "Randomly select the name of a player who has played at least one game in the National Hockey League (NHL) during the last 30 years";
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
            // Sanitize the message text
            parsedMessage.text = parsedMessage.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
            parsedMessage.username = ws.username; // Safety
    
            if (parsedMessage.text.startsWith('#AI')) {
                const aiPrompt = parsedMessage.text.slice(3).trim();
                const aiResponse = await generateText(aiPrompt);
    
                // Ensure the aiResponse is valid and extract 'content'
                if (!aiResponse || typeof aiResponse.content !== 'string') {
                    console.log("AI response was empty or content is not a string:", aiResponse);
                    return;
                }
    
                const aiMessage = {
                    username: "AI",
                    text: aiResponse.content,  // Use the 'content' for the message text
                    roomId: parsedMessage.roomId
                };
    
                const forwardAIMessage = JSON.stringify(aiMessage);
                broker.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(forwardAIMessage);
                    }
                });
            } else {
                // Forward non-AI messages
                const forwardMessage = JSON.stringify(parsedMessage);
                broker.clients.forEach(client => {
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