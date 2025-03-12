import { useEffect } from 'react';
import { useAppStore } from './stores';
import ClientChat from './ClientChat';
import RiderChat from './RiderChat';
import Layout from './Layout'; // Import the new Layout component

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
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!role) {
    return (
      <Layout>
        <div className="mx-auto mt-8">
          <div className="text-red-500 bg-red-100 p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Error</h2>
            <p>Invalid URL parameters: {errorMessage}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h[100] mx-auto">
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
    </Layout>
  );
};

export default App;