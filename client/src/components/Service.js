const Service = {};

Service.origin = window.location.origin;

Service.login = async function (username, password) {
  try {
    const response = await fetch(`${this.origin}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Important for sessions
    });
    console.log(`Response status: ${response.status}`); // Log response status
    return response.ok;
  } catch (error) {
    console.error('Error during login:', error);
    return false;
  }
};

Service.getAllRooms = function () {
  return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', this.origin + '/chat', true);
      xhr.withCredentials = true; // Ensure cookies are included
      xhr.onload = function () {
          if (xhr.status === 200) {
              try {
                  const rooms = JSON.parse(xhr.responseText);
                  console.log('Service.getAllRooms response:', rooms); // Log the response
                  resolve(rooms);
              } catch (error) {
                  console.error('Error parsing JSON:', error);
                  reject(error);
              }
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
  return fetch(`${this.origin}/profile`, { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    })
    .catch(error => Promise.reject(error));
};

Service.addRoom = function (data) {
  return fetch(this.origin + '/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
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

    xhr.open('GET', url);
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

Service.checkSession = function () {
  return fetch(`${this.origin}/check-session`, { credentials: 'include' })
      .then(response => {
          console.log(`Check session response status: ${response.status}`);
          return response.json(); // Ensure this is correctly parsing JSON
      })
      .then(json => {
          console.log(`Check session response body: ${JSON.stringify(json)}`);
          return json;
      })
      .catch(error => {
          console.error('Session check failed:', error);
          throw error;
      });
};

export { Service };
