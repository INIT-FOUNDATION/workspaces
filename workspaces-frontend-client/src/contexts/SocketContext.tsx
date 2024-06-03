import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import socketIOClient from 'socket.io-client';

const SocketContext = createContext<any>(null);

export const useSocket = (socketUrl: string) => {
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = socketIOClient(socketUrl);

    const handleReconnect = () => {
      if (!newSocket.connected) {
        newSocket.open();
      }
    };

    newSocket.on('reconnect_attempt', handleReconnect);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      newSocket.off('reconnect_attempt', handleReconnect);
    };
  }, [socketUrl]);

  return socket;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  return (
    <SocketContext.Provider value={useSocket}>
      {children}
    </SocketContext.Provider>
  );
};
