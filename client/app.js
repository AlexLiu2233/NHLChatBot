var profile = { username: "Alice" };

var Service = {};

Service.origin = window.location.origin;

// Defines a function on the Service object for retrieving all chat rooms
Service.getAllRooms = function () {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", this.origin + "/chat");
    xhr.onload = function () {
      if (xhr.status === 200) {
        // Request successful, resolve using response text
        resolve(JSON.parse(xhr.responseText));
      } else {
        // Create an Error object with the statusText from the server response
        reject(new Error(xhr.responseText));
      }
    };
    xhr.onerror = function () {
      // A network error occurred. Reject the promise with a generic error message.
      reject(new Error(xhr.responseText));
    };
    xhr.send();
  });
};

Service.getProfile = function () {
  return fetch(`${this.origin}/profile`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    })
    .catch(error => Promise.reject(error));
};

Service.addRoom = function (data) {
  // Start a network request to the server.
  return fetch(this.origin + "/chat", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    // This function is called when the server responds.
    .then(response => {
      if (!response.ok) {
        // If the server responded with an error, throw an Error -> catch
        return response.text().then(text => {
          throw new Error(text);
        });
      }
      return response.json();
    })
    .catch(error => {
      // If there was a problem the error will be passed along with a rejected Promise
      return Promise.reject(error);
    });
}

Service.getLastConversation = function (roomId, before) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    var url = `${this.origin}/chat/${roomId}/messages`;
    if (before) {
      url += `?before=${before}`;
    }

    console.log(url);
    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      }
      else if (xhr.status === 404) {
        resolve({ messages: [] });
      }
      else if (xhr.status === 500) {
        reject(new Error('Failed to load conversation: ' + xhr.statusText));
        console.log()
      }
    };

    xhr.onerror = function () {
      reject(new Error('Network error'));
    };
    xhr.send();
  });
};

function* makeConversationLoader(room) {
  let lastConversationTimestamp = room.timeCreated; // Use the initial timestamp, if available

  while (room.canLoadConversation) {
    room.canLoadConversation = false; // Prevent new loads while one is in progress

    // Wrap the asynchronous fetch in a promise that the generator will yield.
    // This allows the caller to wait for the promise to resolve before continuing.
    const conversationPromise = new Promise((resolve, reject) => {
      console.log("Calling getLastConversation with room ID:", room._id);
      Service.getLastConversation(room._id, lastConversationTimestamp)
        .then(conversation => {
          if (!conversation) {
            // If no conversation is returned, stop trying to load more
            resolve(null);
          } else {
            // Update the timestamp for the next fetch, assuming 'conversation.timestamp' is the latest one
            lastConversationTimestamp = conversation.timestamp;
            room.addConversation(conversation);
            room.canLoadConversation = true; // Allow further loads
            resolve(conversation);
          }
        })
        .catch(error => {
          console.error("Failed to fetch conversation:", error);
          reject(error); // In case of error, reject the promise
        });
    });

    // Yield the conversation promise itself. The caller must handle the promise resolution.
    const conversation = yield conversationPromise;
    if (!conversation || conversation.messages.length === 0) {
      room.canLoadConversation = true; // Allow further attempts
    }
  }
}

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM(elem) {
  while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM(htmlString) {
  let template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content.firstChild;
}

// Define the LobbyView class
class LobbyView {
  constructor(lobby) {
    this.elem = createDOM(
      '<div class="view" id="app-view">' +
      '<ul class="menu" id="app-menu">' +
      '<li class="menu-item"><a href="#/">Rooms</a></li>' +
      '<li class="menu-item"><a href="#/profile">Profile</a></li>' +
      '</ul>' +
      '<div id="page-view">' +
      '<div class="content">' +
      '<ul class="room-list">' +
      // Correctly place the text for rooms outside the <img> tags
      '<li class="room"><a class="room-link" href="#/chat"><img class="chat-icon" src="/assets/everyone-icon.png"> Everyone in CPEN400A</a></li>' +
      '<li class="room"><a class="room-link" href="#/chat"><img class="chat-icon" src="/assets/bibimbap.jpg"> Foodies only</a></li>' +
      '<li class="room"><a class="room-link" href="#/chat"><img class="chat-icon" src="/assets/minecraft.jpg"> Gamers unite</a></li>' +
      '<li class="room"><a class="room-link" href="#/chat"><img class="chat-icon" src="/assets/canucks.png"> Canucks fans</a></li>' +
      '</ul>' +
      '<input id="player-keywords" type="text" placeholder="Enter keywords (e.g., position, team)"></input>' +
      '<button id="generate-player-btn">Generate Random NHL Player</button>' +
      '<div class="page-control">' +
      '<input class="page-control-input" type="text" placeholder="Room Title"></input>' +
      '<button class="page-control-button">Create Room</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );

    // Store references to specific DOM elements
    this.lobby = lobby; // Assigning the received lobby argument to the property
    this.listElem = this.elem.querySelector('.room-list'); // ul.room-list element
    this.inputElem = this.elem.querySelector('.page-control-input'); // input element for new room name
    this.buttonElem = this.elem.querySelector('.page-control-button'); // button for creating a room

    this.lobby.onNewRoom = (newRoom) => {
      this.redrawList(); // Redraw the entire list whenever a new room is added
    };

    this.redrawList(); // Call redrawList to draw the initial list of rooms

    this.buttonElem.addEventListener('click', () => {
      const roomName = this.inputElem.value;
      const roomImage = '/path/to/default/image.png'; // You should update this path to the actual default image path for the room

      if (roomName) {
        // Call the addRoom function from the Service object
        Service.addRoom({ name: roomName, image: roomImage })
          .then(newRoom => {
            // Upon successful creation, add the room to the lobby and redraw the list
            this.lobby.addRoom(newRoom._id, newRoom.name, newRoom.image);
            this.redrawList();
            this.inputElem.value = ''; // Clear the input field
          })
          .catch(error => {
            // Handle any errors that occurred during the request
            console.error('Error creating room:', error);
          });
      }
    });

    // AI Gen Button Listener
    this.generatePlayerBtn = this.elem.querySelector('#generate-player-btn');
    this.playerKeywordsInput = this.elem.querySelector('#player-keywords');

    this.generatePlayerBtn.addEventListener('click', () => {
      const keywords = this.playerKeywordsInput.value; // Get keywords from input
      fetch(`${Service.origin}/api/generate-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keywords }) // Pass keywords in the body of the request
      })
        .then(response => response.json())
        .then(data => {
          // Handle the generated player name and display the card
          // For simplicity, using console.log to show the name; you can replace this with your display logic
          console.log(`Generated NHL Player: ${data.playerName}`);
        })
        .catch(error => {
          console.error('Error generating NHL player name:', error);
        });
    });

  }

  // Code in part generated
  redrawList() {
    // First, clear the list to ensure it's empty before adding updated room list
    this.listElem.innerHTML = '';

    // Loop through each room object in the lobby's rooms
    Object.values(this.lobby.rooms).forEach(room => {
      // Create a new list item element for each room
      const roomElement = document.createElement('li');
      roomElement.className = 'room'; // Assign class for styling

      // Create a hyperlink for each room that leads to its chat page
      const roomLink = document.createElement('a');
      roomLink.className = 'room-link'; // Assign class for styling
      roomLink.href = `#/chat/${room._id}`; // Dynamic href that includes the room's ID

      // Set the inner HTML of the link to display the room's image and name
      roomLink.innerHTML = `<img class="chat-icon" src="${room.image}"> ${room.name}`;

      // Append the link to the list item
      roomElement.appendChild(roomLink);

      // Finally, append the list item to the list element in the DOM
      this.listElem.appendChild(roomElement);
    });
  }
}


// Define the ChatView class
class ChatView {
  constructor(socket) {
    this.socket = socket
    this.elem = createDOM(
      `<div id="app-view">
      <ul id="app-menu">
          <li class="menu-item"><a href="#/">Rooms</a></li>
          <li class="menu-item"><a href="#/profile">Profile</a></li>
      </ul>
      <div id="page-view">
          <div class="content">
              <h4 class="room-name">Example Room Name</h4>
              <div class="message-list">
                  <!-- Message from another user -->
                  <div class="message">
                      <span class="message-user">Example User</span>
                      <span class="message-text">Example Text</span>
                  </div>
                  <!-- Message from the current application user -->
                  <div class="message my-message">
                      <span class="message-user">Example Me</span>
                      <span class="message-text">Example My Text</span>
                  </div>
              </div>
              <div class="page-control">
                  <textarea placeholder="Write your message here..."></textarea>
                  <button>Send</button>
                  <input id="player-keywords" type="text" placeholder="Enter keywords (e.g., position, team)"></input>
                  <button id="generate-player-btn">Generate Random NHL Player</button>
              </div>
          </div>
      </div>
  </div>`);

    this.generatePlayerBtn = this.elem.querySelector('#generate-player-btn');
    this.playerKeywordsInput = this.elem.querySelector('#player-keywords');

    this.titleElem = this.elem.querySelector('.room-name'); // h4 element for the room name
    this.chatElem = this.elem.querySelector('.message-list'); // div.message-list container
    this.inputElem = this.elem.querySelector('textarea'); // textarea for entering message
    this.buttonElem = this.elem.querySelector('button'); // button for sending message

    this.room = null;
    this.buttonElem.addEventListener('click', () => this.sendMessage());
    this.inputElem.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        this.sendMessage();
        event.preventDefault(); // Prevent newline for Enter alone
      }
    });

    this.chatElem.addEventListener('wheel', (event) => {
      console.log('ChatView wheel event triggered');
      console.log(`Scroll Top: ${this.chatElem.scrollTop}, deltaY: ${event.deltaY}, canLoadConversation: ${this.room.canLoadConversation}`);
      if (event.deltaY < 0 && this.chatElem.scrollTop <= 0 && this.room.canLoadConversation) {
        this.room.getLastConversation.next();
      }
    });

    this.generatePlayerBtn.addEventListener('click', () => {
      const keywords = this.playerKeywordsInput.value; // Get keywords from input
      fetch(`${Service.origin}/api/generate-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keywords }) // Pass keywords in the body of the request
      })
        .then(response => response.json())
        .then(data => {
          console.log(`Generated NHL Player: ${data.playerName}`);

          // Now send this as a message in the chatroom from "AI"
          if (this.room && this.socket && this.socket.readyState === WebSocket.OPEN) {
            const aiMessage = {
              roomId: this.room._id,
              username: "AI", // Username as "AI"
              text: `Generated... ${data.playerName}`
            };
            this.socket.send(JSON.stringify(aiMessage));

            // Optionally, you can also directly add this message to the DOM
            // if you want it to appear immediately without waiting for a round trip to the server
            this.addMessageToDOM(aiMessage);
          }
        })
        .catch(error => {
          console.error('Error generating NHL player name:', error);
        });
    });
  }

  sendMessage() {
    const text = this.inputElem.value;
    if (text.trim()) {
      this.room.addMessage(profile.username, text);

      // Send message to server {roomId, username, text} (Task 4)
      const message = { roomId: this.room._id, username: profile.username, text: text };
      this.socket.send(JSON.stringify(message));

      this.inputElem.value = '';
    }
  }

  setRoom(room) {
    this.room = room;
    this.titleElem.textContent = room.name;
    emptyDOM(this.chatElem); // Clear existing messages

    // Populate existing messages
    room.messages.forEach(message => this.addMessageToDOM(message));

    // Set up the listener for new messages
    this.room.onNewMessage = (message) => {
      this.addMessageToDOM(message);
    };

    // Attach an onFetchConversation callback to the room
    this.room.onFetchConversation = (conversation) => {
      const scrollHeightBefore = this.chatElem.scrollHeight;
      conversation.messages.forEach(message => {
        const messageElement = this.createMessageElement(message);
        this.chatElem.insertBefore(messageElement, this.chatElem.firstChild);
      });
      const scrollHeightAfter = this.chatElem.scrollHeight;
      this.chatElem.scrollTop = scrollHeightAfter - scrollHeightBefore;
    };
  }

  // Helper method to add a message to the DOM, in part generated
  addMessageToDOM(message) {
    const messageElement = document.createElement('div');
    messageElement.className = message.username === profile.username ? 'message my-message' : 'message';

    // Sanitize the message text by escaping HTML special characters
    const sanitizedText = message.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    messageElement.innerHTML = `<span class="message-user">${message.username}</span>: <span class="message-text">${sanitizedText}</span>`;
    this.chatElem.appendChild(messageElement);
    this.chatElem.scrollTop = this.chatElem.scrollHeight; // Scroll to the bottom
  }

  createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = message.username === profile.username ? 'message my-message' : 'message';
    const sanitizedText = message.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    messageElement.innerHTML = `<span class="message-user">${message.username}</span>: <span class="message-text">${sanitizedText}</span>`;
    return messageElement;
  }


}

// Define the ProfileView class
class ProfileView {
  constructor() {
    this.elem = createDOM(
      '<div id="app-view">' +
      '<ul class="menu" id="app-menu">' +
      '<li class="menu-item"><a href="#/">Rooms</a></li>' +
      '<li class="menu-item"><a href="#/profile">Profile</a></li>' +
      '</ul>' +
      '<div id="page-view">' +
      '<div class="content">' +
      '<div class="profile-form">' +
      '<div class="form-field"><label>Username</label><input type="text" value="Example Username"></input></div>' +
      '<div class="form-field"><label>Password</label><input type="password" placeholder="Password"></input></div>' +
      '<div class="form-field"><label>Avatar Image</label><input type="file"></input></div>' +
      '<div class="form-field"><label>About</label><input type="text" value="Example About"></input></div>' +
      '</div>' +
      '<div class="page-control">' +
      '<button>Save</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }
}

// Define the Room class
class Room {
  constructor(id, name, image = 'assets/everyone-icon.png', messages = []) {
    this._id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
    this.canLoadConversation = true;
    this.getLastConversation = makeConversationLoader(this);
    this.timeCreated = Date.now();
  }

  addMessage(username, text) {
    if (!text.trim()) return; // Ignore empty or whitespace-only messages

    const message = { username, text };
    this.messages.push(message);

    if (this.onNewMessage) {
      this.onNewMessage(message);
    }
  }

  addConversation(conversation) {
    // Prepend new messages to the beginning of the messages array
    this.messages = [...conversation.messages, ...this.messages];

    // Call the onFetchConversation callback, if defined
    if (this.onFetchConversation) {
      this.onFetchConversation(conversation);
    }
  }
}

// Define the Lobby class
class Lobby {
  constructor() {
    this.rooms = {};
  }

  getRoom(roomId) {
    return this.rooms[roomId]; // Return the room by id
  }

  addRoom(id, name, image = 'assets/everyone-icon.png', messages = []) {
    const newRoom = new Room(id, name, image, messages);
    this.rooms[id] = newRoom; // Add the new Room object to the rooms
    if (this.onNewRoom) { // Check if the onNewRoom callback is defined
      this.onNewRoom(newRoom); // Call the callback with the new room
    }
  }
}

// Define the main function that will be called once the page is loaded
function main() {

  const socket = new WebSocket('ws://localhost:8000');

  // Add event listener to WebSocket
  socket.addEventListener('message', function (event) {
    // handle incoming message
    const data = JSON.parse(event.data);
    console.log("Client received - generated text: ", data)
    const room = lobby.getRoom(data.roomId);
    if (room) {
      room.addMessage(data.username, data.text);
    }
  });

  // Instantiate view objects
  const lobby = new Lobby(); //new lobby object
  const lobbyView = new LobbyView(lobby);
  const chatView = new ChatView(socket);
  const profileView = new ProfileView();

  // Fetch profile information and update the profile object
  Service.getProfile().then(data => {
    profile.username = data.username; // Update the global profile object with the fetched username
    // Optionally, you might want to update the UI here to reflect the new profile information
  }).catch(error => {
    console.error('Error fetching profile:', error);
  });

  function renderRoute() {
    // Get element where page content will be displayed
    const pageView = document.getElementById('page-view');
    emptyDOM(pageView); // Use the helper function to clear the content

    const hash = window.location.hash.replace('#/', ''); // Remove '#/' from hash to get route name
    if (hash === '') { // hash empty -> at Lobby View
      pageView.appendChild(lobbyView.elem);
    } else if (hash === "profile") { // hash profile -> at Profile View
      pageView.appendChild(profileView.elem);
    } else if (hash.startsWith("chat/")) { // hash chat/ -> chatroom should be displayed
      console.log("hash is " + hash);
      const roomId = hash.split("/")[1]; // Directly use the part after "chat/" as the roomId
      console.log("roomId is " + roomId);

      // Use the roomId to access the room; set in chat view + add to page
      const room = lobby.getRoom(roomId);
      if (room) {
        chatView.setRoom(room);
        pageView.appendChild(chatView.elem);
      } else {
        console.log("Room not found");
      }
    }
  }

  function refreshLobby() {
    Service.getAllRooms().then(function (roomsArray) {
      roomsArray.forEach(function (room) {
        if (lobby.rooms.hasOwnProperty(room._id)) {
          var existingRoom = lobby.rooms[room._id];
          existingRoom.name = room.name;
          existingRoom.image = room.image;
          // Assume server response includes a messages array for each room
          existingRoom.messages = room.messages || existingRoom.messages;
        } else {
          // Also assume server provides messages array, use empty array as fallback
          lobby.addRoom(room._id, room.name, room.image, room.messages || []);
        }
      });
    }).catch(function (error) {
      console.error("Failed to refresh lobby:", error);
    });
  }

  // Set up the interval to call refreshLobby every 5 seconds
  setInterval(refreshLobby, 5000);

  // Attach renderRoute to window's popstate event
  window.addEventListener('popstate', renderRoute);
  window.addEventListener('hashchange', renderRoute);

  // Call renderRoute once on initial load
  renderRoute();

  // Instantiate Lobby and call refreshLobby once inside main function
  refreshLobby();

  cpen322.export(main, {
    chatView,
    lobby,
  });
}

// Add the main function as the event handler for the window's load event
window.addEventListener('load', main);