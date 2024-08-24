import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import LoginPage from './LoginPage';
import LobbyView from './LobbyView';
import ChatView from './ChatView';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [socket, setSocket] = useState(null); // Initialize socket with null

    useEffect(() => {
        // Create a new WebSocket connection
        const newSocket = new WebSocket('ws://localhost:8000');
        setSocket(newSocket); // Store the WebSocket in state

        // Cleanup function to close the socket when the component unmounts
        return () => {
            if (newSocket.readyState === WebSocket.OPEN) {
                newSocket.close();
            }
        };
    }, []); // Empty dependency array to run only on mount and unmount

    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    {isAuthenticated ? <Redirect to="/lobby" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />}
                </Route>
                <Route path="/lobby">
                    {isAuthenticated ? <LobbyView rooms={rooms} setRooms={setRooms} /> : <Redirect to="/" />}
                </Route>
                <Route path="/chat/:roomId">
                    {isAuthenticated ? <ChatView socket={socket} /> : <Redirect to="/" />}
                </Route>
                <Redirect to="/" />
            </Switch>
        </Router>
    );
};

export default App;
