import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Service } from './Service'; // Import Service
import '../style.css';

const LobbyView = ({ lobby }) => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await Service.getAllRooms();
        setRooms(rooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="view" id="app-view">
      <ul className="menu" id="app-menu">
        <li className="menu-item"><Link to="/">Rooms</Link></li>
        <li className="menu-item"><Link to="/profile">Profile</Link></li>
      </ul>
      <div id="page-view">
        <div className="content">
          <ul className="room-list">
            {rooms.map((room) => (
              <li key={room._id} className="room">
                <Link to={`/chat/${room._id}`} className="room-link">
                  <img className="chat-icon" src={room.image || '/assets/default-room-icon.png'} alt={room.name} />
                  {room.name}
                </Link>
              </li>
            ))}
          </ul>
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
