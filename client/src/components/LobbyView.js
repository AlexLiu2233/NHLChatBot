/**
 * LobbyView.js
 * 
 * This file defines the LobbyView component which renders a list of chat rooms available to the user.
 * It fetches the list of rooms from the backend using the Service.getAllRooms function and displays them.
 * 
 * Props:
 * - rooms (array): An array of room objects to be displayed.
 * - setRooms (function): A function to update the rooms state in the parent component.
 * 
 * Dependencies:
 * - React: Library for building the user interface.
 * - useEffect: React hook for handling side effects.
 * - Link: React Router component for navigation links.
 * - Service: Custom service module for making API requests.
 * - style.css: Contains the styles used in this component.
 * 
 * Connected Files:
 * - Service.js: Contains the Service.getAllRooms function used for fetching room data.
 * - style.css: Contains the styles used in this component.
 * 
 * Usage:
 * Import this component and use it to display the chat rooms available to the user.
 */


import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Service } from './Service';
import '../style.css';

const LobbyView = ({ rooms = [], setRooms }) => {
  useEffect(() => {
    const fetchRooms = async () => {
        try {
            const rooms = await Service.getAllRooms();
            if (!Array.isArray(rooms)) {
                throw new Error('Invalid data format received from the server');
            }
            setRooms(rooms); // This updates the rooms state in App.js
        } catch (error) {
            console.error('Error fetching rooms:', error);
            setRooms([]); // Reset to empty array if there's an error
        }
    };
    fetchRooms();
}, [setRooms]);
  
  // Additional debug logging
  useEffect(() => {
    console.log('Current rooms state:', rooms);
  }, [rooms]);
  
  return (
    <div className="view" id="app-view">
        <ul className="menu" id="app-menu">
            <li className="menu-item"><Link to="/">Rooms</Link></li>
            <li className="menu-item"><Link to="/profile">Profile</Link></li>
        </ul>
        <div id="page-view">
            <div className="content">
                {rooms.length === 0 ? (
                    <p>No rooms available.</p>
                ) : (
                    <ul className="room-list">
                        {rooms.map((room) => (
                            <li key={room._id} className="room">
                                <Link to={{
                                    pathname: `/chat/${room._id}`,
                                    state: { image: room.image }
                                }} className="room-link">
                                    <img className="chat-icon" src={room.image} alt={room.name} />
                                    {room.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="page-control">
                <input type="text" placeholder="Room Title" />
                <button>Create Room</button>
            </div>
        </div>
    </div>
);
};

export default LobbyView;
