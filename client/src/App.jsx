// App.jsx
import { useEffect } from 'react';
import { useAppStore } from './stores';
import ClientChat from './ClientChat';
import RiderChat from './RiderChat';

const App = () => {
  const {
    role,
    socket,
    userId,
    firstName,
    lastName,
    riderFirstName,
    riderLastName,
    riderUserId,
    isLoading,
    errorMessage,
    initializeApp,
    disconnectSocket,
  } = useAppStore();

  useEffect(() => {
    initializeApp();
    return () => disconnectSocket();
  }, [initializeApp, disconnectSocket]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!role) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="text-red-500">Invalid URL parameters: {errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {role === 'rider' ? (
        <RiderChat
          socket={socket}
          userId={userId}
          role={role}
          firstName={firstName}
          lastName={lastName}
          clientFirstName={riderFirstName} // Assuming rider chats with client
          clientLastName={riderLastName}
          clientUserId={riderUserId}
        />
      ) : (
        <ClientChat
          socket={socket}
          userId={userId}
          role={role}
          firstName={firstName}
          lastName={lastName}
          riderFirstName={riderFirstName}
          riderLastName={riderLastName}
          riderUserId={riderUserId}
        />
      )}
    </div>
  );
};

export default App;