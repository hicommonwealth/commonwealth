export interface IWebsocketsPayload {
  event: string; // options: 'message', 'heartbeat', 'typing', 'scrollback'
  text?: string;
  jwt?: string; // for outgoing payloads
  chain?: string; // for incoming payloads
  address?: string; // for incoming payloads
  data?: any[]; // for incoming 'scrollback' payloads
  topic?: string; // for server-side real time-event management
}
