import { useState, useEffect } from "react";
import io from "socket.io-client";
import AdminChat from "./AdminChat";
import UserChat from "./UserChat";

const App = () => {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
        console.log("Socket disconnected");
      }
    };
  }, [socket]);

  const handleRoleSelection = (selectedRole, selectedUserId) => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io("http://localhost:5000", { withCredentials: true });
    newSocket.on("connect", () => {
      console.log(`Socket connected for ${selectedUserId}`);
      newSocket.emit("join", { userId: selectedUserId, role: selectedRole });
    });

    setSocket(newSocket);
    setRole(selectedRole);
    setUserId(selectedUserId);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {!role ? (
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-bold">Select Role</h2>
          <button
            className="bg-blue-500 text-white p-2 rounded"
            onClick={() => handleRoleSelection("admin", "admin1")}
          >
            Login as Admin (admin1)
          </button>
          <button
            className="bg-green-500 text-white p-2 rounded"
            onClick={() => handleRoleSelection("user", "user1")}
          >
            Login as User (user1)
          </button>
        </div>
      ) : role === "admin" ? (
        <AdminChat socket={socket} userId={userId} role={role} />
      ) : (
        <UserChat socket={socket} userId={userId} role={role} />
      )}
    </div>
  );
};

export default App;