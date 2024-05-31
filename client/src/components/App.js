import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';

const App = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // Fetch rooms from the backend
    fetch('/chat')
      .then(response => response.json())
      .then(data => setRooms(data))
      .catch(error => console.error('Error fetching rooms:', error));
  }, []);

  return (
    <Router>
      <div>
        <h1>Chat Application</h1>
        <Switch>
          <Route path="/" exact>
            <h2>Chat Rooms</h2>
            <ul>
              {rooms.map(room => (
                <li key={room._id}>
                  <Link to={`/chat/${room._id}`}>
                    <img src={room.image} alt={room.name} /> {room.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Route>
          <Route path="/chat/:roomId">
            <ChatRoom />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          {/* Add other routes as needed */}
        </Switch>
      </div>
    </Router>
  );
};

// Placeholder components for ChatRoom and Profile
const ChatRoom = () => {
  return <div>Chat Room</div>;
};

const Profile = () => {
  return <div>Profile</div>;
};

export default App;
