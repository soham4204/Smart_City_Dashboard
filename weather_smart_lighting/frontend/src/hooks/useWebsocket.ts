import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { setDashboardState } from '@/lib/redux/dashboardSlice';

const WEBSOCKET_URL = 'ws://localhost:8000/ws/updates';
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket() {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Don't attempt to connect if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('error');
      setLastError(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      setStatus('connecting');
      setLastError(null);
      
      socketRef.current = new WebSocket(WEBSOCKET_URL);

      socketRef.current.onopen = () => {
        console.log('✅ WebSocket connection established');
        setStatus('connected');
        setLastError(null);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
      };

      socketRef.current.onmessage = (event) => {
        console.log('📨 WebSocket message received:', event.data);
        try {
          const updatedState = JSON.parse(event.data);
          dispatch(setDashboardState(updatedState.zones));
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
          setLastError('Failed to parse server message');
        }
      };

      socketRef.current.onclose = (event) => {
        console.warn(
          `🔌 WebSocket closed (code: ${event.code}, reason: ${event.reason || 'No reason'}, wasClean: ${event.wasClean})`
        );
        
        setStatus('disconnected');
        
        // Only attempt reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (!event.wasClean && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          timeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus('error');
          setLastError('Connection failed - maximum retry attempts reached');
        }
      };

      socketRef.current.onerror = (event) => {
        console.error('❌ WebSocket error event:', event);
        console.error('❌ WebSocket error details:', {
          readyState: socketRef.current?.readyState,
          url: WEBSOCKET_URL,
          timestamp: new Date().toISOString()
        });

        setLastError(`Connection error to ${WEBSOCKET_URL}`);
        setStatus('error');
      };


    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setStatus('error');
      setLastError(`Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [dispatch]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    clearReconnectTimeout();
    connect();
  }, [connect, clearReconnectTimeout]);

  // Disconnect function
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
    }
    setStatus('disconnected');
  }, [clearReconnectTimeout]);

  useEffect(() => {
    // Only attempt to connect if we're in a browser environment
    if (typeof window !== 'undefined') {
      connect();
    }

    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect, clearReconnectTimeout]);

  return {
    status,
    lastError,
    reconnect,
    disconnect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    hasError: status === 'error'
  };
}