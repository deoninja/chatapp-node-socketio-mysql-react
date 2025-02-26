import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function UserChat() {
  const userId = 'user1'; // Change dynamically based on user
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    // Set initial mobile view state
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initialize on mount
    handleResize();
    
    // Add listener for window resize
    window.addEventListener("resize", handleResize);

    // Connect to socket
    socket.connect();
    
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { userId, role: 'user' });
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('loadMessages', (loadedMessages) => setMessages(loadedMessages));
    socket.on('receiveMessage', (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('loadMessages');
      socket.off('receiveMessage');
      socket.disconnect();
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

  // Toggle chat view on mobile
  const toggleChatView = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-1 sm:p-2 md:p-4">
      <div className="w-full max-w-screen-xl h-full md:h-[90vh] bg-white shadow-lg rounded-lg flex flex-col">
        {/* Header */}
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-200 text-base sm:text-lg font-bold text-center relative flex items-center justify-center">
          {!showSidebar && isMobileView && (
            <button
              onClick={toggleChatView}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-300 transition"
              aria-label="Back to contact list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <span className="truncate max-w-[60%] sm:max-w-[80%]">
            {!showSidebar || !isMobileView ? 'Chat with Admin' : 'Available Support'}
          </span>
        </div>

        {/* Chat Layout */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Sidebar (Admin Contact) - Toggle visibility on mobile */}
          <div
            className={`md:w-1/3 lg:w-1/4 border-r bg-gray-50 overflow-hidden flex-shrink-0 transition-all duration-300 ${
              !showSidebar && isMobileView ? "h-0 md:h-auto" : "h-auto"
            }`}
          >
            <div className="p-2 sm:p-3 md:p-4 h-full overflow-auto">
              <h2 className="text-sm sm:text-md font-semibold mb-2">Support Contacts</h2>
              <div className="space-y-1 sm:space-y-2">
                <div
                  className="p-2 sm:p-3 cursor-pointer rounded-lg flex items-center transition bg-blue-500 text-white"
                  onClick={() => {
                    if (isMobileView) setShowSidebar(false);
                  }}
                >
                  <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-gray-400"}`}></span>
                  <span className="truncate text-sm sm:text-base">Admin Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Window - Toggle visibility on mobile */}
          <div
            className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
              showSidebar && isMobileView ? "h-0 md:h-auto" : "h-auto"
            }`}
          >
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-xs sm:text-sm text-center p-4">
                    Send a message to start chatting with our support team
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-2 sm:p-3 rounded-lg shadow-md break-words ${
                        msg.sender === userId
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      <p className="text-xs sm:text-sm md:text-base">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-2 sm:p-3 md:p-4 border-t bg-gray-50">
              <div className="flex gap-1 sm:gap-2">
                <input
                  className="flex-1 p-1 sm:p-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors text-sm sm:text-base flex-shrink-0"
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}