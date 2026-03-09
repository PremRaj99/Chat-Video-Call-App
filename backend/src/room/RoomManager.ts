import { WebSocket } from "ws";
import { EXIT, ICE_CANDIDATE, INIT, JOINED, LEAVE, MATCHED, MESSAGE, NEXT, OFFER, ANSWER, VIDEO_CALL_ACCEPTED, VIDEO_CALL_REJECTED, VIDEO_CALL_REQUEST, VIDEO_READY } from "../constant";
import { Room } from "./Room";

export interface User {
    socket: WebSocket;
    name: string;
    videoReady: boolean;
}

export class RoomManager {
    private rooms: Room[];
    private users: User[];

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

            let user = this.users.find(u => u.socket === socket);
            let room = this.rooms.find(r => r.containsUser(socket));

            if (!user && room) {
                user = room.getUserBySocket(socket)!;
            }

            if (!user) return;

            switch (message.type) {
                case INIT:
                    user.name = message.name;
                    this.tryCreateRoom();
                    break;

                case MESSAGE:
                    if (room) room.sendMessageToPartner(user, message.content);
                    break;

                case VIDEO_CALL_REQUEST:
                    if (room) {
                        const partner = room.otherUser(user);
                        partner.socket.send(JSON.stringify({ type: VIDEO_CALL_REQUEST }));
                    }
                    break;

                case VIDEO_CALL_ACCEPTED:
                    if (room) {
                        const partner = room.otherUser(user);
                        partner.socket.send(JSON.stringify({ type: VIDEO_CALL_ACCEPTED }));
                        // FIX: Removed room.requestSDP() from here. We must wait for them to load the video page.
                    }
                    break;

                case VIDEO_CALL_REJECTED:
                    if (room) {
                        const partner = room.otherUser(user);
                        partner.socket.send(JSON.stringify({ type: VIDEO_CALL_REJECTED }));
                    }
                    break;

                case VIDEO_READY:
                    if (room) {
                        user.videoReady = true;
                        const partner = room.otherUser(user);

                        if (partner.videoReady) {
                            room.initiateWebRTC();
                        }
                    }
                    break;
                case OFFER:
                case ANSWER:
                    if (room) room.sendSDPToPartner(user, message);
                    break;

                case ICE_CANDIDATE:
                    if (room) room.sendIceCandidateToPartner(user, message.candidate);
                    break;

                case NEXT:
                    if (room) {
                        const partner = room.otherUser(user);
                        this.rooms = this.rooms.filter(r => r !== room);
                        room.destroy();

                        user.videoReady = false;
                        if (partner) partner.videoReady = false;

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

    public addUser(user: Omit<User, 'videoReady'>): void {
        // Automatically initialize videoReady to false when user connects
        this.users.push({ ...user, videoReady: false });
        this.addHandler(user.socket);
    }

    public removeUser(socket: WebSocket): void {
        this.users = this.users.filter(u => u.socket !== socket);
        const room = this.rooms.find(r => r.containsUser(socket));
        if (room) {
            const partner = room.otherUserBySocket(socket);
            this.rooms = this.rooms.filter(r => r !== room);
            room.destroy();

            if (partner) {
                partner.videoReady = false;
                this.users.push(partner);
                this.tryCreateRoom();
            }
        }
    }

    private tryCreateRoom(): void {
        const eligibleUsers = this.users.filter(u => u.name !== "");

        while (eligibleUsers.length >= 2) {
            const u1 = eligibleUsers.shift()!;
            const u2 = eligibleUsers.shift()!;

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