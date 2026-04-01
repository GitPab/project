/**
 * SSE (Server-Sent Events) Manager
 * Handles real-time updates broadcasting
 */

const clients = new Map();

export function addClient(clientId, res) {
  clients.set(clientId, res);
}

export function removeClient(clientId) {
  clients.delete(clientId);
}

export function broadcastEvent(eventType, data) {
  const message = `data: ${JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() })}\n\n`;
  clients.forEach((res, clientId) => {
    try {
      res.write(message);
    } catch (err) {
      console.error(`Failed to send to client ${clientId}:`, err);
      clients.delete(clientId);
    }
  });
}

export function getClientCount() {
  return clients.size;
}

export default { addClient, removeClient, broadcastEvent, getClientCount };
