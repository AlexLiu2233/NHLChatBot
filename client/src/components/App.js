/**
 * App.js
 * 
 * This file defines the root component for the React application.
 * It sets up routing using React Router and manages the authentication state.
 * 
 * Components:
 * - LoginPage: Handles user login.
 * - LobbyView: Displays the lobby with available chat rooms.
 * - ChatView: Manages individual chat rooms.
 * 
 * Dependencies:
 * - React: Library for building the user interface.
 * - react-router-dom: Provides routing functionalities.
 * 
 * Usage:
 * This component is mounted to the DOM in index.js and handles all top-level routing
 * and state management for authentication.
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import LoginPage from './LoginPage';
import LobbyView from './LobbyView';
import ChatView from './ChatView';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          {isAuthenticated ? <Redirect to="/lobby" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />}
        </Route>
        <Route path="/lobby">
          {isAuthenticated ? <LobbyView /> : <Redirect to="/" />}
        </Route>
        <Route path="/chat/:roomId">
          {isAuthenticated ? <ChatView /> : <Redirect to="/" />}
        </Route>
        <Redirect to="/" />
      </Switch>
    </Router>
  );
};

export default App;
