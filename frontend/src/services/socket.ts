// Real-time chat via native WebSocket (built into React Native — no package needed).
// Connects to ws://LAN-IP:3001/ws alongside the REST API on the same port.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_PORT = 3001;

function resolveWsUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) {
    return override.replace(/\/api\/?$/, '').replace(/^http/, 'ws') + '/ws';
  }
  if (Platform.OS === 'web') return `ws://localhost:${WS_PORT}/ws`;
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `ws://${host}:${WS_PORT}/ws`;
  if (Platform.OS === 'android') return `ws://10.0.2.2:${WS_PORT}/ws`;
  return `ws://localhost:${WS_PORT}/ws`;
}

type MsgHandler = (msg: Record<string, any>) => void;

let ws: WebSocket | null = null;
const handlers = new Set<MsgHandler>();
const pending: string[] = [];

function rawSend(data: object) {
  const str = JSON.stringify(data);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(str);
  } else {
    pending.push(str);
  }
}

export async function connectSocket(): Promise<void> {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  const token = await AsyncStorage.getItem('@gostart_token');
  const url = resolveWsUrl();
  console.log('[WS] Connecting to', url);

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[WS] Connected');
    rawSend({ type: 'auth', token });
    while (pending.length) ws?.send(pending.shift()!);
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string);
      handlers.forEach((h) => h(msg));
    } catch { /* malformed frame */ }
  };

  ws.onerror = (e) => console.log('[WS] Error', e);
  ws.onclose = () => console.log('[WS] Closed');
}

/** Returns a cleanup function that removes the handler. */
export function addHandler(handler: MsgHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function joinChat(chatId: string) {
  rawSend({ type: 'join_chat', chatId });
}

export function sendChatMessage(chatId: string, conversationId: string, text: string) {
  rawSend({ type: 'send_message', chatId, conversationId, text });
}

export function disconnectSocket() {
  ws?.close();
  ws = null;
  handlers.clear();
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN;
}
