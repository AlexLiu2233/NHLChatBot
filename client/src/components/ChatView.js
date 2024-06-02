import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Service } from './Service'; // Import Service
import '../style.css';

const ChatView = ({ socket, profile }) => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatElem = useRef(null);

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
    if (newMessage.trim()) {
      const message = { roomId, username: profile.username, text: newMessage };
      socket.send(JSON.stringify(message));
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.roomId === roomId) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [roomId, socket]);

  useEffect(() => {
    if (chatElem.current) {
      chatElem.current.scrollTop = chatElem.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div id="app-view">
      <ul id="app-menu">
        <li className="menu-item"><a href="#/">Rooms</a></li>
        <li className="menu-item"><a href="#/profile">Profile</a></li>
      </ul>
      <div id="page-view">
        <div className="content">
          <div className="message-list" ref={chatElem}>
            {messages.map((message, index) => (
              <div key={index} className={message.username === profile.username ? 'message my-message' : 'message'}>
                <span className="message-user">{message.username}</span>
                <span className="message-text">{message.text}</span>
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
