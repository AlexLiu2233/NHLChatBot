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

// Define the main function that will be called once the page is loaded
function main() {

  function renderRoute() {
    const pageView = document.getElementById('page-view');
    emptyDOM(pageView); // Use the helper function to clear the content

    const hash = window.location.hash.replace('#/', '');
    switch (hash) {
      case "chat":
        const chatContent = createDOM('<div id="app-view">' +
          '<ul id="app-menu">' +
          '<li class="menu-item"><a href="#/">Rooms</a></li>' +
          '<li class="menu-item"><a href="#/profile">Profile</a></li>' +
          '</ul>' +
          '<div id="page-view">' +
          '<div class="content">' +
          '<h4 class="room-name">Example Room Name</h4>' +
          '<div class="message-list">' +
          '<div class="message"><span class="message-user">Example User</span><span class="message-text">Example Text</span></div>' +
          '<div class="my-message"><span class="message-user">Example Me</span><span class="message-text">Example My Text</span></div>' +
          '</div>' +
          '<div class="page-control">' +
          '<textarea placeholder="Write your message here..."></textarea>' +
          '<button>Send</button>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>');
        pageView.appendChild(chatContent);
        break;
      case "profile":
        const profileContent = createDOM('<div id="app-view">' +
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
          '</div>');
        pageView.appendChild(profileContent);
        break;
      default:
        const lobbyContent = createDOM('<div class="view" id="app-view">' +
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
          '</div>');
        pageView.appendChild(lobbyContent);
    }
  }


  // Attach renderRoute to window's popstate event
  window.addEventListener('popstate', renderRoute);

  // Call renderRoute once on initial load
  renderRoute();
  cpen322.export(arguments.callee, { renderRoute, lobbyView });
}

// Add the main function as the event handler for the window's load event
window.addEventListener('load', main);

