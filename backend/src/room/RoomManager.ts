import { WebSocket } from "ws";
import { Room } from "./Room";
import { EXIT, INIT, JOINED, LEAVE, MATCHED, MESSAGE, NEXT } from "../constant";

// RoomManager.ts (Optimized Logic)

export interface User {
    socket: WebSocket;
    name: string;
}

export class RoomManager {
    private rooms: Room[];
    private users: User[]; // This is the WAITING QUEUE

    constructor() {
        this.rooms = [];
        this.users = [];
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            const dataStr = data.toString();
            let message;
            try {
                message = JSON.parse(dataStr);
            } catch (e) { return; }

            // Find user in EITHER the queue OR a room
            let user = this.users.find(u => u.socket === socket);
            let room = this.rooms.find(r => r.containsUser(socket));

            // If user isn't in the queue, check if they are in a room
            if (!user && room) {
                user = room.getUserBySocket(socket)!;
            }

            if (!user) return;

            switch (message.type) {
                case INIT:
                    user.name = message.name;
                    // Only try to match after name is set
                    this.tryCreateRoom();
                    break;

                case MESSAGE:
                    if (room) room.sendMessageToPartner(user, message.content);
                    break;

                case NEXT:
                    if (room) {
                        const partner = room.otherUser(user);
                        this.rooms = this.rooms.filter(r => r !== room);
                        room.destroy(); // Notify partner they are alone

                        // Put both back in queue to find new matches
                        this.users.push(user);
                        if (partner) this.users.push(partner);
                        this.tryCreateRoom();
                    }
                    break;

                case LEAVE:
                    this.removeUser(socket);
                    socket.send(JSON.stringify({ type: EXIT }));
                    break;
            }
        });
    }

    public addUser(user: User): void {
        this.users.push(user);
        this.addHandler(user.socket);
    }

    public removeUser(socket: WebSocket): void {
        // 1. Remove from waiting queue
        this.users = this.users.filter(u => u.socket !== socket);
        
        // 2. Remove from active rooms
        const room = this.rooms.find(r => r.containsUser(socket));
        if (room) {
            const partner = room.otherUserBySocket(socket);
            this.rooms = this.rooms.filter(r => r !== room);
            room.destroy();
            
            // Optional: Put the abandoned partner back in the queue
            if (partner) {
                this.users.push(partner);
                this.tryCreateRoom();
            }
        }
    }

    private tryCreateRoom(): void {
        // Only match users who have provided a name (INIT completed)
        const eligibleUsers = this.users.filter(u => u.name !== "");
        
        while (eligibleUsers.length >= 2) {
            const u1 = eligibleUsers.shift()!;
            const u2 = eligibleUsers.shift()!;

            // Remove them from the main waiting list
            this.users = this.users.filter(u => u !== u1 && u !== u2);

            const newRoom = new Room(u1, u2);
            this.rooms.push(newRoom);

            u1.socket.send(JSON.stringify({ type: MATCHED }));
            u2.socket.send(JSON.stringify({ type: MATCHED }));
            u1.socket.send(JSON.stringify({ type: JOINED, name: u2.name }));
            u2.socket.send(JSON.stringify({ type: JOINED, name: u1.name }));
        }
    }
}