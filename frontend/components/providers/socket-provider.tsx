"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type SocketContextType = {
  socket: WebSocket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Use an environment variable for production, fallback to localhost for dev
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("🟢 Global Socket Connected");
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log("🔴 Global Socket Disconnected");
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};