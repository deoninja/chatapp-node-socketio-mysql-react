import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { formatTimestamp } from './utils/formatTimestamp';

const socket = io("http://localhost:5000");

export default function AdminChat({ socket: propSocket, userId, role }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const currentSocket = propSocket || socket;
    if (!userId || !role) {
      console.error(`Invalid props for AdminChat: userId=${userId}, role=${role}`);
      return;
    }
    console.log(`Admin ${userId} joining with role ${role}`);
    currentSocket.emit("join", { userId, role });

    currentSocket.on("activeUsersForAdmin", (users) => {
      console.log(`Received activeUsersForAdmin: ${JSON.stringify(users)}`);
      setActiveUsers(Array.isArray(users) ? users : []);
    });

    currentSocket.on("allUsers", (users) => {
      console.log(`Received allUsers: ${JSON.stringify(users)}`);
      setAllUsers(Array.isArray(users) ? users : []);
    });

    currentSocket.on("loadMessages", (loadedMessages) => {
      console.log(`Received loadMessages: ${loadedMessages.length} messages`);
      setMessages(loadedMessages || []);
    });

    currentSocket.on("receiveMessage", (msg) => {
      console.log(`Received message: ${JSON.stringify(msg)}`);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      currentSocket.off("activeUsersForAdmin");
      currentSocket.off("allUsers");
      currentSocket.off("loadMessages");
      currentSocket.off("receiveMessage");
    };
  }, [userId, role, propSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log(`Active users updated: ${JSON.stringify(activeUsers)}`);
  }, [messages, activeUsers]);

  const sendMessage = () => {
    if (!message.trim() || !selectedUser) return;
    const timestamp = new Date().toISOString(); // Use ISO format for consistency
    const newMessage = { sender: userId, recipient: selectedUser, message, timestamp };
    console.log(`Sending message from ${userId} to ${selectedUser}: ${message} at ${timestamp}`);
    (propSocket || socket).emit("sendMessage", newMessage);
    setMessages((prev) => [...prev, newMessage]); // Add to local state immediately
    setMessage("");
  };


  const usersToDisplay = showOnlineOnly ? activeUsers : allUsers;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-1 sm:p-2 md:p-4">
      <div className="w-full max-w-screen-xl h-full md:h-[90vh] bg-white shadow-lg rounded-lg flex flex-col">
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-200 text-base sm:text-lg font-bold text-center relative flex items-center justify-center">
          {selectedUser && isMobileView && (
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-300 transition"
              aria-label="Back to user list"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          <span className="truncate max-w-[60%] sm:max-w-[80%]">
            {selectedUser ? `Chat with ${selectedUser}` : "Select a User"}
          </span>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <div
            className={`md:w-1/3 lg:w-1/4 border-r bg-gray-50 overflow-hidden flex-shrink-0 transition-all duration-300 ${
              selectedUser && isMobileView ? "h-0 md:h-auto" : "h-auto"
            }`}
          >
            <div className="p-2 sm:p-3 md:p-4 h-full overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm sm:text-md font-semibold">User Contacts</h2>
                <div className="flex items-center">
                  <label className="text-xs sm:text-sm mr-2">Online only</label>
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={() => setShowOnlineOnly(!showOnlineOnly)}
                    className="w-4 h-4"
                  />
                </div>
              </div>
              {usersToDisplay.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">No users found</p>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {usersToDisplay.map((user) => (
                    <div
                      key={user}
                      className={`p-2 sm:p-3 cursor-pointer rounded-lg flex items-center transition ${
                        selectedUser === user ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <span
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${
                          activeUsers.includes(user) ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                      <span className="truncate text-sm sm:text-base">{user}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
              !selectedUser && isMobileView ? "h-0 md:h-auto" : "h-auto"
            }`}
          >
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              {selectedUser ? (
                (() => {
                  const filteredMessages = messages
                    .filter(
                      (msg) =>
                        (msg.sender === selectedUser && msg.recipient === userId) ||
                        (msg.recipient === selectedUser && msg.sender === userId)
                    )
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp

                  console.log(`Filtered and sorted messages for ${selectedUser}:`, filteredMessages);
                  return filteredMessages.map((msg) => (
                    <div
                      key={msg.timestamp + msg.sender}
                      className={`flex flex-col ${msg.sender === userId ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-2 sm:p-3 rounded-lg shadow-md break-words ${
                          msg.sender === userId
                            ? "bg-blue-500 text-white rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[15px] rounded-br-[0px]"
                            : "bg-gray-300 text-black rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[0px] rounded-br-[15px]"
                        }`}
                      >
                        <p className="text-xs sm:text-sm md:text-base">{msg.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(msg.timestamp)}</p>
                    </div>
                  ));
                })()
              ) : (
                <div className="hidden md:flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">Select a user to start chatting</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedUser && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}