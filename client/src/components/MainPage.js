import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for routing
import '../style.css'; // Correct path to your CSS file

function MainPage() {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        // Fetch rooms from your server
        fetch(`${window.location.origin}/chat`)
            .then(response => response.json())
            .then(data => setRooms(data))
            .catch(error => console.error('Error fetching rooms:', error));
    }, []);

    return (
        <div className="view" id="app-view">
            <ul className="menu" id="app-menu">
                <li className="menu-item">
                    <Link to="/" className="menu-link"> {/* Replace 'a' with 'Link' */}
                        <img className="menu-icon" src="/assets/chat-icon.png" alt="Rooms Icon" />Rooms
                    </Link>
                </li>
                <li className="menu-item">
                    <Link to="/profile" className="menu-link"> {/* Replace 'a' with 'Link' */}
                        <img className="menu-icon" src="/assets/profile-icon.png" alt="Profile Icon" />Profile
                    </Link>
                </li>
            </ul>
            <div id="page-view">
                <div className="content">
                    <ul className="room-list">
                        {rooms.map(room => (
                            <li key={room._id}>
                                <Link to={`/chat/${room._id}`} className="room-link"> {/* Replace 'a' with 'Link' */}
                                    <img className="chat-icon" src={room.image || '/assets/default-room-icon.png'} alt={room.name} />
                                    {room.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="page-control"></div>
            </div>
        </div>
    );
}

export default MainPage;
