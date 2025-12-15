import { OutgoingMessage, IncomingMessage } from "../types";

const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://parent-site.com']; // In prod, this comes from env

export class CommunicationService {
  private static instance: CommunicationService;
  private listeners: ((msg: IncomingMessage) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage);
    }
  }

  public static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  private handleMessage = (event: MessageEvent) => {
    // Basic security check (would verify origin in production)
    // if (!ALLOWED_ORIGINS.includes(event.origin)) return;

    if (event.data && event.data.type) {
      this.listeners.forEach(listener => listener(event.data as IncomingMessage));
    }
  };

  public sendMessage(message: OutgoingMessage) {
    if (typeof window !== 'undefined' && window.parent) {
      // Target origin * for demo, but should be specific in prod
      window.parent.postMessage(message, '*');
    }
  }

  public subscribe(callback: (msg: IncomingMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const comms = CommunicationService.getInstance();
