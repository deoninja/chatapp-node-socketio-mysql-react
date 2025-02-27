import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function UserChat({ socket: propSocket, userId, role }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const messagesEndRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [availableAdmins, setAvailableAdmins] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const currentSocket = propSocket || socket;
    console.log(`User ${userId} joining with role ${role}`);

    currentSocket.on("connect", () => {
      console.log(`Socket connected for ${userId}`);
      setIsConnected(true);
      currentSocket.emit("join", { userId, role });
    });

    currentSocket.on("disconnect", () => {
      console.log(`Socket disconnected for ${userId}`);
      setIsConnected(false);
    });

    currentSocket.on("activeUsers", (admins) => {
      console.log(`Received activeUsers (admins): ${JSON.stringify(admins)}`);
      setActiveAdmins(Array.isArray(admins) ? admins : []);
    });

    currentSocket.on("availableAdmins", (admins) => {
      console.log(`Received availableAdmins: ${JSON.stringify(admins)}`);
      setAvailableAdmins(Array.isArray(admins) ? admins : []);
    });

    currentSocket.on("loadMessages", (loadedMessages) => {
      console.log(`Received loadMessages: ${loadedMessages.length} messages`);
      setMessages(loadedMessages || []);
    });

    currentSocket.on("receiveMessage", (msg) => {
      console.log(`Received message in UserChat: ${JSON.stringify(msg)}`);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      currentSocket.off("connect");
      currentSocket.off("disconnect");
      currentSocket.off("activeUsers");
      currentSocket.off("availableAdmins");
      currentSocket.off("loadMessages");
      currentSocket.off("receiveMessage");
    };
  }, [userId, role, propSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log(`Active admins updated: ${JSON.stringify(activeAdmins)}`);
    console.log(`Messages updated: ${JSON.stringify(messages)}`);
  }, [messages, activeAdmins]);

  const sendMessage = () => {
    if (!message.trim() || !selectedAdmin) return;
    const newMessage = { sender: userId, recipient: selectedAdmin, message };
    console.log(`Sending message from ${userId} to ${selectedAdmin}: ${message}`);
    (propSocket || socket).emit("sendMessage", newMessage);
    setMessage("");
  };

  const toggleChatView = () => setShowSidebar(!showSidebar);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-1 sm:p-2 md:p-4">
      <div className="w-full max-w-screen-xl h-full md:h-[90vh] bg-white shadow-lg rounded-lg flex flex-col">
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
            {!showSidebar || !isMobileView ? `Chat with ${selectedAdmin || "Admin"}` : "Available Support"}
          </span>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <div
            className={`md:w-1/3 lg:w-1/4 border-r bg-gray-50 overflow-hidden flex-shrink-0 transition-all duration-300 ${
              !showSidebar && isMobileView ? "h-0 md:h-auto" : "h-auto"
            }`}
          >
            <div className="p-2 sm:p-3 md:p-4 h-full overflow-auto">
              <h2 className="text-sm sm:text-md font-semibold mb-2">Support Contacts</h2>
              {availableAdmins.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">No admins available</p>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {availableAdmins.map((admin) => (
                    <div
                      key={admin}
                      className={`p-2 sm:p-3 cursor-pointer rounded-lg flex items-center transition ${
                        selectedAdmin === admin ? "bg-blue-500 text-white" : "hover:bg-blue-100"
                      }`}
                      onClick={() => {
                        if (isMobileView) setShowSidebar(false);
                        setSelectedAdmin(admin);
                        console.log(`Selected admin: ${admin}`);
                      }}
                    >
                      <span
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${
                          activeAdmins.includes(admin) ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                      <span className="truncate text-sm sm:text-base">{admin}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
              showSidebar && isMobileView ? "h-0 md:h-auto" : "h-auto"
            }`}
          >
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              {selectedAdmin && messages.length > 0 ? (
                (() => {
                  const filteredMessages = messages.filter(
                    (msg) =>
                      (msg.sender === selectedAdmin && msg.recipient === userId) ||
                      (msg.recipient === selectedAdmin && msg.sender === userId)
                  );
                  console.log(`Filtered messages for ${selectedAdmin}:`, filteredMessages);
                  return filteredMessages.map((msg, index) => (
                    <div
                      key={msg.timestamp + msg.sender}
                      className={`flex ${msg.sender === userId ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-2 sm:p-3 rounded-lg shadow-md break-words ${
                          msg.sender === userId ? "bg-blue-500 text-white rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[15px] rounded-br-[0px]" : "bg-gray-300 text-black rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[0px] rounded-br-[15px]"
                        }`}
                      >
                        <p className="text-xs sm:text-sm md:text-base">{msg.message}</p>
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-xs sm:text-sm text-center p-4">
                    Send a message to start chatting with an admin
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-2 sm:p-3 md:p-4 border-t bg-gray-50">
              <div className="flex gap-1 sm:gap-2">
                <input
                  className="flex-1 p-1 sm:p-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  placeholder={`Type a message to ${selectedAdmin || "an admin"}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={!selectedAdmin}
                />
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors text-sm sm:text-base flex-shrink-0"
                  onClick={sendMessage}
                  disabled={!selectedAdmin}
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