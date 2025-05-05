// src/lib/websocket.ts
interface WebSocketOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: string) => void;
  onStatusChange?: (isConnected: boolean) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export class ReliableWebSocket {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private options: Required<WebSocketOptions>;
  private retryTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(options: WebSocketOptions) {
    // Set default options
    this.options = {
      maxRetries: 5,
      retryDelay: 3000,
      onError: (error) => console.error('WebSocket error:', error),
      onStatusChange: () => {},
      ...options
    };
    this.connect();
  }

  private connect() {
    this.isManualClose = false;
    
    try {
      // Create new WebSocket connection
      this.ws = new WebSocket(this.options.url);
      
      this.ws.onopen = () => {
        this.retryCount = 0;
        this.options.onStatusChange(true);
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          // Skip ping responses
          if (event.data === 'pong') return;
          
          // Parse incoming data
          const data = typeof event.data === 'string' 
            ? JSON.parse(event.data) 
            : event.data;
          this.options.onMessage(data);
        } catch (error) {
          this.handleError('Failed to parse message: ' + error);
        }
      };

      this.ws.onerror = (event) => {
        this.handleError('WebSocket error: ' + (event.message || 'Unknown error'));
      };

      this.ws.onclose = (event) => {
        if (!this.isManualClose) {
          this.handleError(`Connection closed: ${event.reason || 'Unknown reason'}`);
          this.retry();
        }
        this.cleanup();
      };

    } catch (error) {
      this.handleError('WebSocket initialization failed: ' + error);
      this.retry();
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('ping');
        } catch (error) {
          this.handleError('Ping failed: ' + error);
        }
      }
    }, 30000);
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.options.onStatusChange(false);
  }

  private handleError(message: string) {
    console.error(message);
    this.options.onError(message);
  }

  private retry() {
    if (this.retryCount >= this.options.maxRetries) {
      this.handleError('Max reconnection attempts reached');
      return;
    }

    this.retryCount++;
    const delay = Math.min(
      this.options.retryDelay * Math.pow(2, this.retryCount - 1),
      30000 // Max 30 second delay
    );
    
    console.log(`Reconnecting attempt ${this.retryCount} in ${delay}ms...`);
    
    this.retryTimeout = setTimeout(() => {
      if (!this.isManualClose) {
        this.connect();
      }
    }, delay);
  }

  public close() {
    this.isManualClose = true;
    this.cleanup();
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        this.handleError('Error closing WebSocket: ' + error);
      }
    }
  }
}