// src/app/api/realtime-sales/route.ts
import { WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Check if WebSocket server already exists
if (!global.wss) {
  try {
    const wss = new WebSocketServer({ noServer: true });
    const clients = new Set<WebSocket>();

    // Heartbeat interval
    const heartbeatInterval = setInterval(() => {
      clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) {
          client.terminate();
          clients.delete(client);
        } else {
          client.ping();
        }
      });
    }, 30000);

    // Firestore listener
    const unsubscribe = adminDb
      .collection('orders')
      .where('status', '==', 'completed')
      .onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              try {
                const order = change.doc.data();
                if (!order.timestamp || typeof order.total !== 'number') {
                  console.warn('Invalid order format:', change.doc.id);
                  return;
                }

                const orderData = JSON.stringify({
                  id: change.doc.id,
                  amount: order.total,
                  timestamp: order.timestamp.toDate().toISOString()
                });

                clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(orderData);
                  }
                });
              } catch (error) {
                console.error('Error processing order change:', error);
              }
            }
          });
        },
        (error) => {
          console.error('Firestore listener error:', error);
        }
      );

    // Connection handler
    wss.on('connection', (ws) => {
      clients.add(ws);
      console.log('New client connected');

      ws.on('pong', () => {
        // Client is responsive
      });

      ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
        clients.delete(ws);
      });
    });

    // Cleanup
    const cleanup = () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
      wss.close();
      clients.clear();
      console.log('WebSocket server cleaned up');
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    global.wss = wss;
    global.wssCleanup = cleanup;

  } catch (error) {
    console.error('WebSocket server initialization failed:', error);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'WebSocket endpoint requires WebSocket protocol' },
    { status: 400 }
  );
}

export const config = {
  api: {
    bodyParser: false,
  },
};