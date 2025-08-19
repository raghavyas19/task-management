import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket(onEvents: { [event: string]: (data: any) => void }) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    Object.entries(onEvents).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
    return () => {
      Object.entries(onEvents).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.disconnect();
    };
  }, [onEvents]);

  return socketRef.current;
}
