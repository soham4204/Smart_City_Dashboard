import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { setDashboardState, setLoading, setError } from '@/lib/redux/dashboardSlice';

const WEBSOCKET_URL = 'ws://localhost:8000/ws/updates';
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket() {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');

  const clearReconnectTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      dispatch(setError());
      setStatus('error');
      return;
    }

    dispatch(setLoading());
    setStatus('connecting');
    
    socketRef.current = new WebSocket(WEBSOCKET_URL);

    socketRef.current.onopen = () => {
      console.log('✅ WebSocket connection established');
      setStatus('connected');
      reconnectAttemptsRef.current = 0; 
    };

    socketRef.current.onmessage = (event) => {
      try {
        const updatedState = JSON.parse(event.data);
        
        // FIXED: Handle simplified and consistent payload from backend
        dispatch(setDashboardState({
          zones: updatedState.zones, 
          agentResult: updatedState.agentResult 
        }));

      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
        dispatch(setError());
      }
    };

    socketRef.current.onclose = () => {
      console.warn('🔌 WebSocket closed');
      setStatus('disconnected');
      
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        timeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
      } else {
        dispatch(setError());
        setStatus('error');
      }
    };

    socketRef.current.onerror = (event) => {
      console.error('❌ WebSocket error event:', event);
      setStatus('error');
      dispatch(setError());
    };

  }, [dispatch, clearReconnectTimeout]);

  useEffect(() => {
    connect();
    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.onclose = null; // prevent reconnect on unmount
        socketRef.current.close();
      }
    };
  }, [connect, clearReconnectTimeout]);

  return { status };
}
