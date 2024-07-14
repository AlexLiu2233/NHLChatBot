import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Service } from './Service';
import '../style.css';

const ChatView = ({ socket }) => {
  const { roomId } = useParams();
  const location = useLocation();
  const roomImage = location.state?.image;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profile, setProfile] = useState(null); // Store user profile
  const chatElem = useRef(null);

  useEffect(() => {
    Service.getProfile().then(profile => {
      setProfile(profile);
    }).catch(error => {
      console.error('Failed to fetch profile:', error);
    });
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const conversation = await Service.getLastConversation(roomId);
        setMessages(conversation.messages);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchMessages();
  }, [roomId]);

  const sendMessage = () => {
    if (newMessage.trim() && socket && profile) {
      if (socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. Cannot send message.');
        return;
      }
  
      const formattedMessage = newMessage.trim();
      const message = { 
        roomId, 
        username: profile.username,  
        text: `${profile.username}: ${formattedMessage}`
      };
  
      console.log('Sending message:', message);
      socket.send(JSON.stringify(message));
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };
  
  useEffect(() => {
    if (!socket) {
      console.error('Socket is not defined in ChatView when trying to add event listener');
      return;
    }
  
    console.log('WebSocket is readyState:', socket.readyState);
  
    const handleMessage = (event) => {
      console.log('Received event:', event);
      const data = JSON.parse(event.data);
      if (data.roomId === roomId) {
        setMessages(prevMessages => [...prevMessages, { username: profile.username, text: data.text }]);
      }
    };
  
    const handleOpen = () => {
      console.log('WebSocket connection opened');
    };
  
    const handleClose = (event) => {
      console.log('WebSocket connection closed:', event);
    };
  
    const handleError = (error) => {
      console.error('WebSocket error:', error);
    };
  
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);
  
    return () => {
      if (socket) {
        socket.removeEventListener('message', handleMessage);
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('close', handleClose);
        socket.removeEventListener('error', handleError);
      }
    };
  }, [roomId, socket]);
  

  useEffect(() => {
    if (chatElem.current) {
      chatElem.current.scrollTop = chatElem.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div id="app-view" style={{ backgroundImage: `url(${roomImage})`, backgroundSize: 'cover' }}>
      <ul id="app-menu">
        <li className="menu-item"><a href="#/">Rooms</a></li>
        <li className="menu-item"><a href="#/profile">Profile</a></li>
      </ul>
      <div id="page-view">
        <div className="content">
          <div className="message-list" ref={chatElem}>
            {messages.map((message, index) => (
              <div key={index} className={message.username === profile?.username ? 'message my-message' : 'message'}>
                <span className="message-user" dangerouslySetInnerHTML={{ __html: message.username }}></span>
                <span className="message-text" dangerouslySetInnerHTML={{ __html: message.text }}></span>
              </div>
            ))}
          </div>

          <div className="page-control">
            <textarea
              placeholder="Write your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  sendMessage();
                  e.preventDefault();
                }
              }}
            ></textarea>
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
