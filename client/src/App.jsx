import { useState, useEffect } from "react";
import io from "socket.io-client";
import AdminChat from "./AdminChat";
import UserChat from "./UserChat";

const socket = io("http://localhost:5000"); // Adjust based on your server URL

export default function App() {
  const [role, setRole] = useState(""); // "admin" or "user"

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      {!role ? (
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-bold">Select Role</h2>
          <button className="bg-blue-500 text-white p-2 rounded" onClick={() => setRole("admin")}>
            Login as Admin
          </button>
          <button className="bg-green-500 text-white p-2 rounded" onClick={() => setRole("user")}>
            Login as User
          </button>
        </div>
      ) : role === "admin" ? (
        <AdminChat socket={socket} />
      ) : (
        <UserChat socket={socket} />
      )}
    </div>
  );
}
