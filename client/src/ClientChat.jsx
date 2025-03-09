import { useEffect, useState, useRef } from "react";
import { formatTimestamp } from './utils/formatTimestamp';

export default function ClientChat({ socket, userId, role, firstName, lastName }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedRider, setSelectedRider] = useState(null);
  const [activeRiders, setActiveRiders] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const messagesEndRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    socket.emit("join", { userId, role });

    socket.on("activeRiders", (riders) => setActiveRiders(Array.isArray(riders) ? riders : []));
    socket.on("availableRiders", (riders) => setAvailableRiders(Array.isArray(riders) ? riders : []));
    socket.on("loadMessages", (loadedMessages) => setMessages(loadedMessages || []));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("messageRead", ({ messageId, read_at }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: 1, read_at } : msg))
      );
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.off("activeRiders");
      socket.off("availableRiders");
      socket.off("loadMessages");
      socket.off("receiveMessage");
      socket.off("messageRead");
    };
  }, [socket, userId, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (selectedRider) {
      const unreadMessages = messages.filter(
        (msg) => msg.recipient === userId && msg.sender === selectedRider && !msg.is_read
      );
      unreadMessages.forEach((msg) => {
        socket.emit("markMessageRead", { messageId: msg.id, read_at: new Date().toISOString() });
      });
    }
  }, [messages, selectedRider, socket, userId]);

  const sendMessage = () => {
    if (!message.trim() || !selectedRider) return;
    const timestamp = new Date().toISOString();
    const newMessage = { sender: userId, recipient: selectedRider, message, timestamp, is_read: 0 };
    socket.emit("sendMessage", newMessage);
    setMessage("");
  };

  const getUserDisplayName = (userId) => {
    const user = availableRiders.find((rider) => rider.userId === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  const getUnreadCount = (riderId) => {
    return messages.filter(
      (msg) => msg.sender === riderId && msg.recipient === userId && !msg.is_read && msg.sender !== userId
    ).length;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-1 sm:p-2 md:p-4">
      <div className="w-full max-w-screen-xl h-full md:h-[90vh] bg-white shadow-lg rounded-lg flex flex-col">
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-200 text-base sm:text-lg font-bold text-center relative flex items-center justify-center">
          {selectedRider && isMobileView && (
            <button onClick={() => setSelectedRider(null)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-300 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <span className="truncate max-w-[60%] sm:max-w-[80%]">
            {selectedRider ? `Chat with ${getUserDisplayName(selectedRider)}` : `Client: ${firstName} ${lastName}`}
          </span>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <div className={`md:w-1/3 lg:w-1/4 border-r bg-gray-50 overflow-hidden flex-shrink-0 transition-all duration-300 ${selectedRider && isMobileView ? "h-0 md:h-auto" : "h-auto"}`}>
            <div className="p-2 sm:p-3 md:p-4 h-full overflow-auto">
              <h2 className="text-sm sm:text-md font-semibold mb-2">Riders</h2>
              {availableRiders.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">No riders found</p>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {availableRiders.map((rider) => {
                    const unreadCount = getUnreadCount(rider.userId);
                    return (
                      <div
                        key={rider.userId}
                        className={`p-2 sm:p-3 cursor-pointer rounded-lg flex items-center justify-between transition ${selectedRider === rider.userId ? "bg-blue-500 text-white" : "hover:bg-gray-200"}`}
                        onClick={() => setSelectedRider(rider.userId)}
                      >
                        <div className="flex items-center">
                          <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${activeRiders.includes(rider.userId) ? "bg-green-500" : "bg-gray-400"}`}></span>
                          <span className="truncate text-sm sm:text-base">{`${rider.firstName} ${rider.lastName}`}</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${!selectedRider && isMobileView ? "h-0 md:h-auto" : "h-auto"}`}>
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              {selectedRider ? (
                messages
                  .filter((msg) => (msg.sender === selectedRider && msg.recipient === userId) || (msg.recipient === selectedRider && msg.sender === userId))
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === userId ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[85%] p-2 sm:p-3 rounded-lg shadow-md break-words ${msg.sender === userId ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                        <p className="text-xs sm:text-sm md:text-base">{msg.message}</p>
                        {msg.is_read === 1 && msg.sender === userId && (
                          <p className="text-xs text-gray-200 mt-1">Seen at {formatTimestamp(msg.read_at)}</p>
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

            {selectedRider && (
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
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors text-sm sm:text-base" onClick={sendMessage}>
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