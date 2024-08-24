/**
 * server.js
 * 
 * This file sets up the Express server, handles API routes, WebSocket connections, and session management.
 * It also serves static files and provides a framework for interaction with a MongoDB database.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const sessionManager = new SessionManager();
const { createCompletion, loadModel } = require('gpt4all');
const axios = require('axios');
const app = express();
const db = new Database('mongodb://127.0.0.1:27017', 'HockeyWordleAnswers');
const broker = new WebSocket.Server({ port: 8000 });
const messageBlockSize = 10;
const protectRoute = sessionManager.middleware;
const clientApp = path.join(__dirname, '../client/build'); // Adjusted to point to the correct build directory
let messages = {};

// Express Server
const host = 'localhost';
const port = 3000;

// Load the GPT4All model
const modelPromise = loadModel("mistral-7b-openorca.gguf2.Q4_0.gguf", {
    verbose: true,
    device: "gpu"
});

// Initialize messages for each room
db.getRooms().then(rooms => {
    rooms.forEach(room => {
        messages[room._id.toString()] = [];
    });
}).catch(err => {
    console.error('Error initializing rooms:', err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(clientApp)); // Serve static files

// Serve static files from the 'images' directory
// Serve static files from the '../images' directory
app.use('/images', express.static(path.join(__dirname, '../images')));


// Logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.get('/chat', protectRoute, (req, res) => {
    db.getRooms().then(rooms => {
        const roomList = rooms.map(room => ({
            _id: room._id,
            name: room.name,
            image: room.image || '/assets/default-room-icon.png',
            messages: messages[room._id.toString()] || []
        }));
        console.log('Rooms being sent to client:', roomList);
        res.json(roomList);
    }).catch(err => {
        console.error('Error fetching chat rooms:', err);
        res.status(500).send('Error fetching chat rooms');
    });
});

app.post('/api/generate-player', async (req, res) => {
    const { keywords } = req.body;
    const prompt = `Please name a player who played in the National Hockey League and is a good fit for these: ${keywords}. Please ensure your response begins with the name.`;

    const generatedResponse = await generateText(prompt);

    if (generatedResponse && generatedResponse.content) {
        const generatedText = generatedResponse.content;
        const playerName = generatedText.trim().split(/\s+/).slice(0, 2).join(' ');
        console.log("The playerName is: ", playerName)
        if (playerName) {
            res.json({ playerName });
        } else {
            res.status(404).json({ error: 'No valid player name found in generated response.' });
        }
    } else {
        console.error('Error with generated response:', generatedResponse);
        res.status(500).json({ error: 'Failed to generate a valid player name. Please try again later.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for username: '${username}' with password: '${password}'`);

    try {
        const user = await db.getUser(username);
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'User not found' });
        }

        // Use the simple password check
        const passwordMatches = await isCorrectPasswordSimple(password, user.playerName);
        if (passwordMatches) {
            sessionManager.createSession(res, username);
            console.log('Authentication successful');
            return res.status(200).json({ message: 'Authentication successful' });
        } else {
            console.log('Authentication failed');
            return res.status(401).json({ message: 'Authentication failed' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal Server Error on /login POST' });
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
                res.json({ messages: [] });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error fetching conversation');
        });
});

app.get('/chat/:room_id', protectRoute, (req, res) => {
    const roomId = req.params.room_id;
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

app.post('/chat', protectRoute, (req, res) => {
    const result = req.body;
    if (!result.name) {
        res.status(400).send("data does not have a name field");
    } else {
        const tmp_room = {
            name: result.name,
            image: result.image
        };
        db.addRoom(tmp_room)
            .then(insertedRoom => {
                messages[insertedRoom._id.toString()] = [];
                res.status(200).json(insertedRoom);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error adding room');
            });
    }
});

app.get('/profile', protectRoute, (req, res) => {
    if (req.username) {
        res.json({ username: req.username });
    } else {
        res.status(404).send('User not found');
    }
});

app.get('/api/random-hockey-wordle', async (req, res) => {
    try {
        const randomAnswer = await db.getRandomHockeyWordleAnswer();
        
        if (randomAnswer) {
            console.log('Random Team Name:', randomAnswer.teamName);
            console.log('Random Player Name:', randomAnswer.playerName);
            res.json(randomAnswer);
        } else {
            console.error('Random Hockey Wordle Answer is undefined');
            res.status(500).json({ error: 'Failed to fetch random Hockey Wordle answer' });
        }
    } catch (error) {
        console.error('Failed to fetch random Hockey Wordle answer:', error);
        res.status(500).json({ error: 'Failed to fetch random Hockey Wordle answer' });
    }
});

// WebSocket message handling
broker.on('connection', (ws, req) => {
    try {
        const cookieString = req.headers.cookie;
        const cookies = cookieString.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            acc[key] = value;
            return acc;
        }, {});

        const sessionToken = cookies['cpen322-session']; // Change to your new session name if needed
        const username = sessionManager.getUsername(sessionToken);
        if (!username) {
            console.log('Invalid session token. Closing WebSocket connection.');
            ws.close(1000, "Invalid session");
            return;
        }

        ws.username = username;
        console.log(`WebSocket connection established for user: ${ws.username}`);
    } catch (error) {
        console.error('Error during WebSocket connection initialization:', error);
        ws.close(1011, "Unexpected error during initialization");
        return;
    }

    ws.on('message', async (message) => {
        if (ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket is not open. Cannot process the message:', message);
            return;
        }

        let parsedMessage;
        try {
            console.log('Raw message received:', message);
            parsedMessage = JSON.parse(message);
            console.log('Parsed message:', parsedMessage);

            const playerName = parsedMessage.text.trim();
            const roomId = parsedMessage.roomId;

            // Logging player and room information
            console.log(`Processing message for player: "${playerName}" in room: "${roomId}"`);

            // Generate a response based on playerName and room's team name
            const room = await db.getRoom(roomId);
            if (!room) {
                console.log(`Room with ID "${roomId}" not found.`);
                ws.send(JSON.stringify({ roomId, username: 'Bot', text: `Room not found.` }));
                return;
            }

            const teamName = room.name;
            console.log(`Generating response for player: "${playerName}" with team context: "${teamName}"`);

            const prompt = `Write a wiki-style report on the player "${playerName}" focusing on the team "${teamName}".`;
            const generatedResponse = await generateText(prompt);

            let responseText = "Unable to generate report. Please try again.";
            if (generatedResponse && generatedResponse.content) {
                responseText = generatedResponse.content.trim();
                console.log('Generated response:', responseText);
            } else {
                console.log('No content generated for the response.');
            }

            const responseMessage = JSON.stringify({ roomId, username: 'Bot', text: responseText });
            console.log('Sending generated response:', responseMessage);

            // Send response to all clients in the room
            broker.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(responseMessage);
                    console.log('Sent response to client:', client.username);
                }
            });

        } catch (e) {
            console.error("Error parsing or handling message:", e);
            ws.send(JSON.stringify({ roomId: parsedMessage?.roomId, username: 'Bot', text: 'Error processing your request.' }));
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`WebSocket connection closed for ${ws.username}. Code: ${code}, Reason: ${reason}`);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${ws.username}:`, error);
        ws.close(1011, "Error occurred during WebSocket communication");
    });
});



// Catch-all route to serve the index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(clientApp, 'index.html'));
});

function logRequest(req, res, next) {
    console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
    next();
}

async function isCorrectPasswordSalted(password, saltedHash) {
    const salt = saltedHash.substring(0, 20);
    const originalHash = saltedHash.substring(20);

    const formattedPassword = password.charAt(0).toUpperCase() + password.slice(1).toLowerCase();

    const hash = crypto.createHash('sha256').update(formattedPassword + salt).digest('base64');
    console.log(`Formatted password: ${formattedPassword}`);
    console.log(`Expected hash: ${originalHash}, Generated hash: ${hash}`);

    return originalHash === hash;
}

async function isCorrectPasswordSimple(inputPassword, correctPassword) {
    const formattedInputPassword = inputPassword.trim().toLowerCase();
    const formattedCorrectPassword = correctPassword.trim().toLowerCase();

    console.log(`Input Password: ${formattedInputPassword}`);
    console.log(`Correct Password: ${formattedCorrectPassword}`);

    return formattedInputPassword === formattedCorrectPassword;
}



app.listen(port, () => {
    console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});
