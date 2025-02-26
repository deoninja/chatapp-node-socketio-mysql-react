import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function UserChat() {
  const userId = 'user1'; // Change dynamically based on user
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join', { userId, role: 'user' });

    socket.on('loadMessages', (loadedMessages) => setMessages(loadedMessages));
    socket.on('receiveMessage', (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off('loadMessages');
      socket.off('receiveMessage');
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = { sender: userId, recipient: 'admin', message };
    setMessages((prev) => [...prev, newMessage]);
    socket.emit('sendMessage', newMessage);
    setMessage('');
  };

  return (
    <div className='flex flex-col h-screen bg-gray-100'>
      <div className='p-4 border-b bg-gray-200 text-lg font-bold text-center'>
        Chat with Admin
      </div>

      <div className='flex-1 p-4 overflow-auto space-y-2'>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === 'admin' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-md break-words ${
                msg.sender === 'admin'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-black'
              }`}
            >
              <p className='text-sm'>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className='p-4 border-t flex bg-white'>
        <input
          className='flex-1 p-2 border rounded-lg'
          type='text'
          placeholder='Type a message...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className='bg-blue-500 text-white p-2 ml-2 rounded-lg'
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
