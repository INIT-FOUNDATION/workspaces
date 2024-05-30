import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import socketIOClient from 'socket.io-client';
import { workspacesWebsocketBaseUrl } from '../utils/config';

const SocketContext = createContext<any>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = socketIOClient(workspacesWebsocketBaseUrl);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
