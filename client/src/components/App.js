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
    console.log("Authentication status changed:", isAuthenticated);
  }, [isAuthenticated]); // This useEffect will log whenever isAuthenticated changes

  useEffect(() => {
    Service.checkSession()
      .then((response) => {
        if (response.message === 'Session is valid') {
          setIsAuthenticated(true);
          Service.getAllRooms()
            .then(setRooms)
            .catch(error => console.error('Error fetching rooms:', error));
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  return (
    <Router>
      <div>
        <h1>Chat Application</h1>
        <Switch>
          <Route path="/login">
            {!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} /> : <Redirect to="/" />}
          </Route>
          <Route path="/" exact>
            {isAuthenticated ? <LobbyView rooms={rooms} setRooms={setRooms} /> : <Redirect to="/login" />}
          </Route>
          <Route path="/chat/:roomId">
            {isAuthenticated ? <ChatView /> : <Redirect to="/login" />}
          </Route>
          <Route path="/profile">
            {isAuthenticated ? <Profile /> : <Redirect to="/login" />}
          </Route>
          <Redirect to="/login" />
        </Switch>
      </div>
    </Router>
  );
};

const Profile = () => {
  return <div>Profile</div>;
};

export default App;
