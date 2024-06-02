import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import LoginPage from './LoginPage';
import MainPage from './MainPage'; // Add this import

const App = () => {
  const [rooms, setRooms] = useState([]);

  return (
    <Router>
      <div>
        <h1>Chat Application</h1>
        <Switch>
          <Route path="/" exact>
            <MainPage /> // Route to MainPage
          </Route>
          <Route path="/chat/:roomId">
            <ChatRoom />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/login">
            <LoginPage />
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
