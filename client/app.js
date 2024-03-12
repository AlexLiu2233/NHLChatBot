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

    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Failed to load conversation: ' + xhr.statusText));
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
      Service.getLastConversation(room.id, lastConversationTimestamp)
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
    yield conversationPromise;
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
            this.lobby.addRoom(newRoom.id, newRoom.name, newRoom.image);
            this.redrawList();
            this.inputElem.value = ''; // Clear the input field
          })
          .catch(error => {
            // Handle any errors that occurred during the request
            console.error('Error creating room:', error);
          });
      }
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
      roomLink.href = `#/chat/${room.id}`; // Dynamic href that includes the room's ID

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
              </div>
          </div>
      </div>
  </div>`);

    this.titleElem = this.elem.querySelector('.room-name'); // h4 element for the room name
    this.chatElem = this.elem.querySelector('.message-list'); // div.message-list container
    this.inputElem = this.elem.querySelector('textarea'); // textarea for entering message
    this.buttonElem = this.elem.querySelector('button'); // button for sending message

    this.buttonElem.addEventListener('click', () => this.sendMessage());
    this.inputElem.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        this.sendMessage();
        event.preventDefault(); // Prevent newline for Enter alone
      }
    });
     // Adjusted wheel listener for infinite scrolling
     this.chatElem.addEventListener('wheel', (event) => this.wheelFunction(event));

     this.room = null; // Initialize room as null
  }

  async wheelFunction(event) {
    const isScrollingUp = event.deltaY < 0;
    if (isScrollingUp && this.chatElem.scrollTop === 0 && this.room && this.room.canLoadConversation) {
        this.room.canLoadConversation = false; // Prevent further loads while processing
        
        try {
            const { value: conversation, done } = await this.room.getLastConversation.next();
            
            if (!done && conversation) {
                // Add the loaded conversation at the top of the chat
                conversation.messages.forEach(message => {
                    this.addMessageToDOM(message, true); // true indicates prepending
                });
            }
            this.room.canLoadConversation = !done;
        } catch (error) {
            console.error("Error loading conversation:", error);
        }
    }
}

addMessageToDOM(message, prepend = false) {
  const messageElement = document.createElement('div');
  messageElement.className = message.username === profile.username ? 'message my-message' : 'message';
  messageElement.innerHTML = `<span class="message-user">${message.username}</span>: <span class="message-text">${message.text}</span>`;
  
  if (prepend) {
      this.chatElem.prepend(messageElement);
  } else {
      this.chatElem.appendChild(messageElement);
  }
  // Adjust scroll only when appending new messages
  if (!prepend) this.chatElem.scrollTop = this.chatElem.scrollHeight;
}

  sendMessage() {
    const text = this.inputElem.value;
    if (text.trim()) {
      this.room.addMessage(profile.username, text);

      // Send message to server {roomId, username, text} (Task 4)
      const message = { roomId: this.room.id, username: profile.username, text: text };
      this.socket.send(JSON.stringify(message));

      this.inputElem.value = '';
    }
  }

  setRoom(room) {
    this.room = room;
    this.titleElem.textContent = room.name;

    this.room.onFetchConversation = (conversation) => {
      // Calculate the current scroll height before adding new messages
      const currentScrollHeight = this.chatElem.scrollHeight;
      
      // Add messages to the chat view
      // Assuming you have a method to create message elements from conversation messages
      conversation.messages.forEach(message => {
          const messageElem = this.createMessageElement(message);
          this.chatElem.prepend(messageElem); // Prepend to the chat view
      });
      
      // Adjust scroll position to maintain view
      const newScrollHeight = this.chatElem.scrollHeight;
      this.chatElem.scrollTop += newScrollHeight - currentScrollHeight;
  };

    emptyDOM(this.chatElem); // Clear existing messages

    // Populate existing messages
    room.messages.forEach(message => this.addMessageToDOM(message));

    // Set up the listener for new messages
    this.room.onNewMessage = (message) => {
      this.addMessageToDOM(message);
    };
  }

  // Helper method to add a message to the DOM, in part generated
  addMessageToDOM(message) {
    const messageElement = document.createElement('div');
    messageElement.className = message.username === profile.username ? 'message my-message' : 'message';
    messageElement.innerHTML = `<span class="message-user">${message.username}</span>: <span class="message-text">${message.text}</span>`;
    this.chatElem.appendChild(messageElement);
    this.chatElem.scrollTop = this.chatElem.scrollHeight; // Scroll to the bottom
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
        if (lobby.rooms.hasOwnProperty(room.id)) {
          var existingRoom = lobby.rooms[room.id];
          existingRoom.name = room.name;
          existingRoom.image = room.image;
          // Assume server response includes a messages array for each room
          existingRoom.messages = room.messages || existingRoom.messages;
        } else {
          // Also assume server provides messages array, use empty array as fallback
          lobby.addRoom(room.id, room.name, room.image, room.messages || []);
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

  cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby, refreshLobby, socket });
}

// Add the main function as the event handler for the window's load event
window.addEventListener('load', main);