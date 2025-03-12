import { useEffect, useRef } from 'react';
import { useChatStore } from './stores';
import { formatTimestamp } from './utils/formatTimestamp'; // Keep this for other timestamp formatting
import { formatDistanceToNow } from 'date-fns'; // Import date-fns
import { ArrowLeft, User } from 'lucide-react';

export default function ClientChat({ socket, userId, role, firstName, lastName, riderFirstName, riderLastName, riderUserId }) {
  const {
    messages,
    message,
    selectedUser,
    activeUsers,
    allUsers,
    isMobileView,
    setMessages,
    addMessage,
    setMessage,
    setSelectedUser,
    setActiveUsers,
    setAllUsers,
    setIsMobileView,
    updateMessageRead,
  } = useChatStore();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    socket.emit('join', { userId, role });

    socket.on('activeRiders', setActiveUsers);
    socket.on('availableRiders', (riders) => setAllUsers(riders));
    socket.on('loadMessages', (loadedMessages) => setMessages(loadedMessages || []));
    socket.on('receiveMessage', addMessage);
    socket.on('messageRead', ({ messageId, read_at }) => updateMessageRead(messageId, read_at));

    if (riderUserId && !selectedUser) setSelectedUser(riderUserId);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('activeRiders');
      socket.off('availableRiders');
      socket.off('loadMessages');
      socket.off('receiveMessage');
      socket.off('messageRead');
    };
  }, [socket, userId, role, riderUserId, selectedUser, setSelectedUser, setActiveUsers, setAllUsers, setMessages, addMessage, updateMessageRead, setIsMobileView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (selectedUser) {
      const unreadMessages = messages.filter(
        (msg) => msg.recipient === userId && msg.sender === selectedUser && !msg.is_read
      );
      unreadMessages.forEach((msg) => {
        socket.emit('markMessageRead', { messageId: msg.id, read_at: new Date().toISOString() });
      });
    }
  }, [messages, selectedUser, socket, userId]);

  const sendMessage = () => {
    if (!message.trim() || !selectedUser) return;
    const msg = { sender: userId, recipient: selectedUser, message, timestamp: new Date().toISOString() };
    socket.emit('sendMessage', msg);
    setMessage('');
  };

  const getUserDisplayName = (userId) => {
    const user = allUsers.find((rider) => rider.userId === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  const getUnreadCount = (riderId) => {
    return messages.filter(
      (msg) => msg.sender === riderId && msg.recipient === userId && !msg.is_read && msg.sender !== userId
    ).length;
  };

  return (
    <div className="relative w-full flex items-center justify-center bg-gray-100 p-1 sm:p-2 md:p-4">
      <div className="w-full max-w-screen-xl h-[80vh] bg-white shadow-lg rounded-lg flex flex-col">
        <div className="p-2 sm:p-3 md:p-4 border-b bg-[#e75951] text-white text-base sm:text-lg font-bold text-center relative flex items-center justify-center">
          {selectedUser && isMobileView && (
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#d14e47] transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="truncate max-w-[60%] sm:max-w-[80%]">
            {selectedUser ? `Chat with ${getUserDisplayName(selectedUser)}` : `Client: ${firstName} ${lastName}`}
          </span>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <div
            className={`md:w-1/3 lg:w-1/4 border-r bg-gray-50 overflow-hidden flex-shrink-0 transition-all duration-300 ${
              selectedUser && isMobileView ? 'h-0 md:h-auto' : 'h-auto'
            }`}
          >
            <div className="p-2 sm:p-3 md:p-4 h-full overflow-auto">
              <h2 className="text-sm sm:text-md font-semibold mb-2">Riders</h2>
              {allUsers.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">No riders found</p>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {allUsers.map((rider) => {
                    const unreadCount = getUnreadCount(rider.userId);
                    return (
                      <div
                        key={rider.userId}
                        className={`p-2 sm:p-3 cursor-pointer rounded-lg flex items-center justify-between transition ${
                          selectedUser === rider.userId ? 'bg-[#e75951] text-white' : 'hover:bg-gray-200'
                        }`}
                        onClick={() => setSelectedUser(rider.userId)}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-400 flex items-center justify-center text-white mr-2">
                            <User className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <span
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${
                              activeUsers.includes(rider.userId) ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></span>
                          <span className="truncate text-sm sm:text-base">{`${rider.firstName} ${rider.lastName}`}</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-[#e75951] text-white text-xs rounded-full px-2 py-1">{unreadCount}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
              !selectedUser && isMobileView ? 'h-0 md:h-auto' : 'h-auto'
            }`}
          >
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              {selectedUser ? (
                messages
                  .filter(
                    (msg) =>
                      (msg.sender === selectedUser && msg.recipient === userId) ||
                      (msg.recipient === selectedUser && msg.sender === userId)
                  )
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === userId ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2 sm:p-3 rounded-lg shadow-md break-words ${
                          msg.sender === userId ? 'bg-[#e75951] text-white' : 'bg-gray-300 text-black'
                        }`}
                      >
                        <p className="text-xs sm:text-sm md:text-base">{msg.message}</p>
                        {msg.is_read === 1 && msg.sender === userId && (
                          <p className="text-xs text-gray-200 mt-1">
                            Seen {formatDistanceToNow(new Date(msg.read_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(msg.timestamp)}</p>
                    </div>
                  ))
              ) : (
                <div className="hidden md:flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">Select a rider to start chatting</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedUser && (
              <div className="p-2 sm:p-3 md:p-4 border-t bg-gray-50">
                <div className="flex gap-1 sm:gap-2">
                  <input
                    className="flex-1 p-1 sm:p-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e75951]"
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    className="bg-[#e75951] hover:bg-[#d14e47] text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                    onClick={sendMessage}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}