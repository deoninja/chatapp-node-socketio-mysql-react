// stores.js
import { create } from 'zustand';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const useAppStore = create((set) => ({
  role: '',
  userId: '',
  socket: null,
  firstName: '',
  lastName: '',
  riderFirstName: '',
  riderLastName: '',
  riderUserId: '',
  isLoading: true,
  errorMessage: '',
  setRole: (role) => set({ role }),
  setUserId: (userId) => set({ userId }),
  setSocket: (socket) => set({ socket }),
  setFirstName: (firstName) => set({ firstName }),
  setLastName: (lastName) => set({ lastName }),
  setRiderFirstName: (riderFirstName) => set({ riderFirstName }),
  setRiderLastName: (riderLastName) => set({ riderLastName }),
  setRiderUserId: (riderUserId) => set({ riderUserId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  initializeApp: async () => {
    const token = window.location.search.substring(1);

    if (!token) {
      set({ errorMessage: 'Missing JWT token in URL', isLoading: false });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!decoded || !decoded.clientId) {
        set({ errorMessage: 'Invalid JWT token', isLoading: false });
        return;
      }

      const clientIdString = decoded.clientId;
      const params = new URLSearchParams(clientIdString);
      const fromClient = params.get('fromClient');
      const toRider = params.get('toRider');

      if (!fromClient || !toRider) {
        set({ errorMessage: 'Missing fromClient or toRider in token', isLoading: false });
        return;
      }

      const clientResponse = await axios.get(`https://api.bong2x.com/api/v1/clients/${fromClient}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const clientData = clientResponse.data;
      if (!clientData.success || !clientData.data) {
        set({ errorMessage: 'Invalid client data', isLoading: false });
        return;
      }
      const clientRoleId = clientData.data.id;
      const clientFirstName = clientData.data.client_name;
      const clientLastName = 'client';

      const riderResponse = await axios.get(`https://api.bong2x.com/api/v1/riders/${toRider}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const riderData = riderResponse.data;
      if (!riderData.success || !riderData.data) {
        set({ errorMessage: 'Invalid rider data', isLoading: false });
        return;
      }
      const riderRoleId = riderData.data.id;
      const riderFirstName = riderData.data.first_name;
      const riderLastName = riderData.data.last_name;

      const clientRegisterResponse = await axios.post(
        'http://localhost:5000/api/users/register-or-login',
        {
          roleId: clientRoleId,
          firstName: clientFirstName,
          lastName: clientLastName,
          role: 'client',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      if (clientRegisterResponse.status !== 200 && clientRegisterResponse.status !== 201) {
        set({ errorMessage: clientRegisterResponse.data.message || 'Client registration/login failed', isLoading: false });
        return;
      }
      const clientUserId = clientRegisterResponse.data.user.userId;

      const riderRegisterResponse = await axios.post(
        'http://localhost:5000/api/users/register-or-login',
        {
          roleId: riderRoleId,
          firstName: riderFirstName,
          lastName: riderLastName,
          role: 'rider',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      if (riderRegisterResponse.status !== 200 && riderRegisterResponse.status !== 201) {
        set({ errorMessage: riderRegisterResponse.data.message || 'Rider registration/login failed', isLoading: false });
        return;
      }
      const riderUserId = riderRegisterResponse.data.user.userId;

      let id = clientUserId;
      let role = 'client';
      let firstName = clientFirstName;
      let lastName = clientLastName;

      const newSocket = io('http://localhost:5000', { withCredentials: true });
      newSocket.on('connect', () => {
        console.log(`Joining with userId: ${id}, role: ${role}`);
        newSocket.emit('join', { userId: id, role });
      });

      set({
        socket: newSocket,
        role,
        userId: id,
        firstName,
        lastName,
        riderFirstName,
        riderLastName,
        riderUserId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Initialization error:', error);
      set({ errorMessage: error.response?.data?.message || 'Network error: Unable to connect to server', isLoading: false });
    }
  },
  disconnectSocket: () => {
    set((state) => {
      if (state.socket) state.socket.disconnect();
      return { socket: null };
    });
  },
}));

export const useChatStore = create((set) => ({
  messages: [],
  message: '',
  selectedUser: null,
  activeUsers: [],
  allUsers: [],
  isMobileView: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => {
    console.log('Adding message to store:', msg); // Debug log
    return { messages: [...state.messages, msg] };
  }),
  setMessage: (message) => set({ message }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setActiveUsers: (activeUsers) => set({ activeUsers: Array.isArray(activeUsers) ? activeUsers : [] }),
  setAllUsers: (allUsers) => set({ allUsers: Array.isArray(allUsers) ? allUsers : [] }),
  setIsMobileView: (isMobileView) => set({ isMobileView }),
  updateMessageRead: (messageId, read_at) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, is_read: 1, read_at } : msg
      ),
    })),
}));