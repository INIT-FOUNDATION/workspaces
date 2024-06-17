import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: ReactNode;
  socketUrl: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, socketUrl }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const useWebsocketForPermissions = process.env.REACT_APP_WORKSPACES_PARTICIPANT_PERMISSIONS_APPROACH === "websocket";
    if (useWebsocketForPermissions) {
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
    }
  }, [socketUrl]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
