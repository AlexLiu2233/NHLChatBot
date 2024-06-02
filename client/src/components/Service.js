const Service = {};

Service.origin = window.location.origin;

Service.getAllRooms = function () {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", this.origin + "/chat");
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText));
      }
    };
    xhr.onerror = function () {
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
  return fetch(this.origin + "/chat", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text);
        });
      }
      return response.json();
    })
    .catch(error => {
      return Promise.reject(error);
    });
};

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
      } else if (xhr.status === 404) {
        resolve({ messages: [] });
      } else if (xhr.status === 500) {
        reject(new Error('Failed to load conversation: ' + xhr.statusText));
      }
    };

    xhr.onerror = function () {
      reject(new Error('Network error'));
    };
    xhr.send();
  });
};

export { Service };
