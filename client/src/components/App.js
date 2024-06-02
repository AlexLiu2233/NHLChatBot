import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginPage from './LoginPage';
import MainPage from './MainPage';
import ChatView from './ChatView';
import LobbyView from './LobbyView';
import { Service } from './Service'; // Assuming Service is defined in a separate file

const App = () => {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState({ username: 'Alice' });
  const socket = new WebSocket('ws://localhost:8000');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await Service.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <Router>
      <div>
        <h1>Chat Application</h1>
        <Switch>
          <Route path="/" exact>
            <LobbyView lobby={{ rooms, setRooms }} />
          </Route>
          <Route path="/chat/:roomId">
            <ChatView socket={socket} profile={profile} />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/login">
            <LoginPage />
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

const Profile = () => {
  return <div>Profile</div>;
};

export default App;
