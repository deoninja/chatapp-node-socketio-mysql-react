import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function AdminChat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("join", { userId: "admin", role: "admin" });

    socket.on("activeUsers", (users) => {
      setActiveUsers(users.filter((user) => user !== "admin")); // Remove admin from user list
    });

    socket.on("loadMessages", (loadedMessages) => setMessages(loadedMessages));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("activeUsers");
      socket.off("loadMessages");
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !selectedUser) return;

    const newMessage = { sender: "admin", recipient: selectedUser, message };
    setMessages((prev) => [...prev, newMessage]); // Show message instantly
    socket.emit("sendMessage", newMessage);
    setMessage("");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-[800px] h-[80vh] bg-white shadow-lg rounded-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-200 text-lg font-bold text-center">
          {selectedUser ? `Chat with ${selectedUser}` : "Select a User"}
        </div>

        {/* Chat Layout */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Sidebar (User List) */}
          {/* <div className="w-full md:w-1/3 max-w-[800px] h-[auto]  bg-gray-100 p-4 overflow-auto">
            <h2 className="text-md font-semibold mb-2">Active Users</h2>
            {activeUsers.length === 0 ? (
              <p className="text-gray-500 text-sm">No active users</p>
            ) : (
              activeUsers.map((user) => (
                <div
                  key={user}
                  className={`p-3 cursor-pointer rounded-lg transition ${
                    selectedUser === user ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  {user}
                </div>
              ))
            )}
          </div> */}
          <div className="w-full md:w-1/3 max-w-[800px] h-[auto] bg-gray-100 p-4 overflow-auto">
  <h2 className="text-md font-semibold mb-2">Active Users</h2>
  {activeUsers.length === 0 ? (
    <p className="text-gray-500 text-sm">No active users</p>
  ) : (
    activeUsers.map((user) => (
      <div
        key={user}
        className={`p-3 cursor-pointer rounded-lg flex items-center transition ${
          selectedUser === user ? "bg-blue-500 text-white" : "hover:bg-gray-200"
        }`}
        onClick={() => setSelectedUser(user)}
      >
        <span
          className={`w-3 h-3 rounded-full mr-2 ${
            activeUsers.includes(user) ? "bg-green-500" : "bg-gray-400"
          }`}
        ></span>
        {user}
      </div>
    ))
  )}
</div>


          {/* Chat Window */}
          <div className="w-full md:w-2/3 max-w-[750px] h-[73vh] flex flex-col p-4">
            <div className="flex-1 overflow-y-auto space-y-3 bg-gray-50 p-3 rounded-lg">
              {messages
                .filter((msg) => msg.sender === selectedUser || msg.recipient === selectedUser)
                .map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === "admin" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-md break-words ${
                        msg.sender === "admin"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t flex bg-gray-100">
              <input
                className="flex-1 p-2 border rounded-lg"
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                className="bg-blue-500 text-white p-2 ml-2 rounded-lg"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
