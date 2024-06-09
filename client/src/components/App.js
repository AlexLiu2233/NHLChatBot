import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LoginPage from './LoginPage';
import ChatView from './ChatView';
import LobbyView from './LobbyView';
import { Service } from './Service';

const App = () => {
  const [rooms, setRooms] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await Service.getProfile();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchRooms = async () => {
        try {
          const roomsData = await Service.getAllRooms();
          setRooms(roomsData);
        } catch (error) {
          console.error('Error fetching rooms:', error);
        }
      };

      fetchRooms();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Router>
        <Switch>
          <Route path="/login">
            <LoginPage />
          </Route>
          <Redirect to="/login" />
        </Switch>
      </Router>
    );
  }

  return (
    <Router>
      <div>
        <h1>Chat Application</h1>
        <Switch>
          <Route path="/" exact>
            <LobbyView rooms={rooms} setRooms={setRooms} />
          </Route>
          <Route path="/chat/:roomId">
            <ChatView />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/login">
            <LoginPage />
          </Route>
          <Redirect to="/" />
        </Switch>
      </div>
    </Router>
  );
};

const Profile = () => {
  return <div>Profile</div>;
};

export default App;
