'use client';

import { useWebSocket } from '@/hooks/useWebsocket';

export default function WebSocketManager() {
  // This component's sole purpose is to establish and maintain the 
  // WebSocket connection for the entire application lifecycle.
  // It doesn't render any UI. The hook handles all the logic.
  useWebSocket();

  return null;
}
