// App.jsx
import { useState, useEffect } from "react";
import io from "socket.io-client";
import RiderChat from "./RiderChat";
import ClientChat from "./ClientChat";

const App = () => {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [socket, setSocket] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const riderId = urlParams.get("riderId");
    const clientId = urlParams.get("clientId");
    const firstName = urlParams.get("firstName");
    const lastName = urlParams.get("lastName");

    const registerOrLogin = async () => {
      let id, role;

      if (riderId) {
        id = riderId;
        role = "rider";
      } else if (clientId) {
        id = clientId;
        role = "client";
      }

      if (!id && !firstName && !lastName) {
        setErrorMessage("Missing all required parameters: riderId/clientId, firstName, and lastName");
        setIsLoading(false);
        return;
      }
      if (!id) {
        setErrorMessage("Missing riderId or clientId parameter");
        setIsLoading(false);
        return;
      }
      if (!firstName) {
        setErrorMessage("Missing firstName parameter");
        setIsLoading(false);
        return;
      }
      if (!lastName) {
        setErrorMessage("Missing lastName parameter");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/register-or-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, firstName, lastName, role })
        });

        if (response.ok) {
          const data = await response.json();
          const newSocket = io("http://localhost:5000", { withCredentials: true });
          
          newSocket.on("connect", () => {
            newSocket.emit("join", { userId: id, role });
          });

          setSocket(newSocket);
          setRole(role);
          setUserId(id);
          setFirstName(firstName);
          setLastName(lastName);
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.message || "Registration/Login failed");
        }
      } catch (error) {
        console.error("Registration/Login error:", error);
        setErrorMessage("Network error: Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    registerOrLogin();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!role) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="text-red-500">
          Invalid URL parameters: {errorMessage}
        </div>
        <div className="mt-2">
          Please use one of these formats:
          <ul className="list-disc pl-5 mt-2">
            <li>For rider: http://localhost:5174/chat?riderId=1&firstName=John&lastName=Doe</li>
            <li>For client: http://localhost:5174/chat?clientId=2&firstName=Jane&lastName=Smith</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {role === "rider" ? (
        <RiderChat socket={socket} userId={userId} role={role} firstName={firstName} lastName={lastName} />
      ) : (
        <ClientChat socket={socket} userId={userId} role={role} firstName={firstName} lastName={lastName} />
      )}
    </div>
  );
};

export default App;