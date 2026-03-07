import http from "http";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import { RoomManager } from "./room/RoomManager";
import "dotenv/config";

const PORT = Number(process.env.PORT);

if (!PORT) {
  throw new Error("PORT is not defined");
}

// Create HTTP server (required for Render)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket server running");
});

// Attach WebSocket to HTTP server
const wss = new WebSocketServer({ server });

const roomManager = new RoomManager();

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");
  roomManager.addUser({ socket: ws, name: "" });

  ws.on("error", console.error);

  ws.on("close", () => {
    roomManager.removeUser(ws);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
