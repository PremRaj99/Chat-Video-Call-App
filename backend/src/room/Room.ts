import { WebSocket } from "ws";
import { MESSAGE, PARTNER_LEFT } from "../constant";
import { User } from "./RoomManager";

// Room.ts
export class Room {
    constructor(private user1: User, private user2: User) {}

    public containsUser(socket: WebSocket): boolean {
        return this.user1.socket === socket || this.user2.socket === socket;
    }

    public getUserBySocket(socket: WebSocket): User | null {
        if (this.user1.socket === socket) return this.user1;
        if (this.user2.socket === socket) return this.user2;
        return null;
    }

    public otherUser(currentUser: User): User {
        return currentUser.socket === this.user1.socket ? this.user2 : this.user1;
    }

    public otherUserBySocket(socket: WebSocket): User | null {
        if (this.user1.socket === socket) return this.user2;
        if (this.user2.socket === socket) return this.user1;
        return null;
    }

    public sendMessageToPartner(sender: User, message: string) {
        const partner = this.otherUser(sender);
        partner.socket.send(JSON.stringify({ type: MESSAGE, content: message }));
    }

    public destroy() {
        // Notify both that the session in this room is over
        [this.user1, this.user2].forEach(u => {
            if (u.socket.readyState === WebSocket.OPEN) {
                u.socket.send(JSON.stringify({ type: PARTNER_LEFT }));
            }
        });
    }
}