import { Response } from "express";
import { RealtimeEventPayload } from "../../types/index.ts";

interface ClientConnection {
  userId: string;
  res: Response;
  id: string;
}

class EventDispatcher {
  private clients: Map<string, ClientConnection> = new Map();

  public addClient(userId: string, res: Response): string {
    const connId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.clients.set(connId, { userId, res, id: connId });

    // Send initial keep-alive / connection ack
    res.write(
      `data: ${JSON.stringify({ type: "CONNECTED", userId, timestamp: new Date().toISOString() })}\n\n`,
    );

    return connId;
  }

  public removeClient(connId: string) {
    this.clients.delete(connId);
  }

  public sendToUser(userId: string, payload: RealtimeEventPayload) {
    const raw = `data: ${JSON.stringify(payload)}\n\n`;
    for (const [_, client] of this.clients.entries()) {
      if (client.userId === userId) {
        try {
          client.res.write(raw);
        } catch (err) {
          console.error(`Error sending SSE to user ${userId}:`, err);
        }
      }
    }
  }

  public broadcast(payload: RealtimeEventPayload) {
    const raw = `data: ${JSON.stringify(payload)}\n\n`;
    for (const [_, client] of this.clients.entries()) {
      try {
        client.res.write(raw);
      } catch (err) {
        console.error("Error broadcasting SSE:", err);
      }
    }
  }

  public getActiveCount(): number {
    return this.clients.size;
  }
}

export const eventDispatcher = new EventDispatcher();
