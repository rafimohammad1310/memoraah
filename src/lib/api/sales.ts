// src/lib/api/sales.ts
export interface SalesData {
    months: string[];
    amounts: number[];
  }
  
  export const fetchSalesData = async (): Promise<SalesData> => {
    try {
      // In a real app, this would be your actual API endpoint
      const response = await fetch('/api/sales');
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  };
  
  export const setupSalesWebSocket = (callback: (data: number) => void) => {
    // This would connect to your real WebSocket endpoint
    const ws = new WebSocket('wss://your-api.com/realtime-sales');
  
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data.amount);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  
    return () => ws.close();
  };