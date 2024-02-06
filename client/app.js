var profile = { username: "Alice" };


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

// example usage
var messageBox = createDOM(
  `<div>
          <span>Alice</span>
          <span>Hello World</span>
      </div>`
);

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
      if (roomName) {
        this.lobby.addRoom(Date.now().toString(), roomName); // Using current timestamp as unique ID
        this.redrawList();
        this.inputElem.value = ''; // Clear the input field
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
  constructor() {
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

    this.room = null;
    this.buttonElem.addEventListener('click', () => this.sendMessage());
    this.inputElem.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        this.sendMessage();
        event.preventDefault(); // Prevent newline for Enter alone
      }
    });
  }

  sendMessage() {
    const text = this.inputElem.value;
    if (text.trim()) {
      this.room.addMessage(profile.username, text);
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
    this.id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
  }

  addMessage(username, text) {
    if (!text.trim()) return; // Ignore empty or whitespace-only messages

    const message = { username, text };
    this.messages.push(message);

    if (this.onNewMessage) {
      this.onNewMessage(message);
    }
  }
}

// Define the Lobby class
class Lobby {
  constructor() {
    // Initialize rooms with 4 Room objects
    this.rooms = {
      'room-1': new Room('room-1', 'Room 1', 'assets/image1.png'),
      'room-2': new Room('room-2', 'Room 2', 'assets/image2.png'),
      'room-3': new Room('room-3', 'Room 3', 'assets/image3.png'),
      'room-4': new Room('room-4', 'Room 4', 'assets/image4.png'),
    };
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

  // Instantiate view objects
  const lobby = new Lobby(); //new lobby object
  const lobbyView = new LobbyView(lobby);
  const chatView = new ChatView();
  const profileView = new ProfileView();

  function renderRoute() {
    const pageView = document.getElementById('page-view');
    emptyDOM(pageView); // Use the helper function to clear the content

    const hash = window.location.hash.replace('#/', '');
    if (hash === '') {
      pageView.appendChild(lobbyView.elem);
    } else if (hash === "profile") {
      pageView.appendChild(profileView.elem);
    } else if (hash.startsWith("chat/")) {
      console.log("hash is " + hash);
      const roomId = hash.split("/")[1]; // Directly use the part after "chat/" as the roomId
      console.log("roomId is " + roomId);
    
      const room = lobby.getRoom(roomId); // Use the roomId to access the room
      if (room) {
        chatView.setRoom(room);
        pageView.appendChild(chatView.elem);
      } else {
        console.log("Room not found");
      }
    }
  }


  // Attach renderRoute to window's popstate event
  window.addEventListener('popstate', renderRoute);
  window.addEventListener('hashchange', renderRoute);

  // Call renderRoute once on initial load
  renderRoute();
  cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby });
}

// Add the main function as the event handler for the window's load event
window.addEventListener('load', main);

