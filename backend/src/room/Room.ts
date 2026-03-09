import { WebSocket } from "ws";
import { MESSAGE, PARTNER_LEFT, SEND_OFFER } from "../constant";
import { User } from "./RoomManager";

export class Room {
    constructor(private user1: User, private user2: User) { }

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
    public initiateWebRTC() {
        this.user1.socket.send(JSON.stringify({ type: SEND_OFFER }));
    }

    public sendSDPToPartner(sender: User, payload: any) {
        const partner = this.otherUser(sender);
        partner.socket.send(JSON.stringify(payload));
    }

    public sendIceCandidateToPartner(sender: User, candidate: any) {
        const partner = this.otherUser(sender);
        partner.socket.send(JSON.stringify({ type: "ice_candidate", candidate }));
    }

    public destroy() {
        this.user1.videoReady = false;
        this.user2.videoReady = false;

        [this.user1, this.user2].forEach(u => {
            if (u.socket.readyState === WebSocket.OPEN) {
                u.socket.send(JSON.stringify({ type: PARTNER_LEFT }));
            }
        });
    }
}