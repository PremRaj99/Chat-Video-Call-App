# Omegle Clone – Real-Time Chat & Video Calling

A real-time random chat and video calling platform inspired by Omegle.  
Users can connect with strangers for text or video conversations using **WebSockets for signaling** and **WebRTC for peer-to-peer media streaming**.

The project is built with a modern full-stack architecture using **Next.js**, **Node.js**, and **TypeScript**, with plans to integrate **Redis**, **authentication**, and **persistent data storage** for scalability.

---

## 🚀 Features

- Random user matching
- Real-time messaging using WebSockets
- Peer-to-peer video calls using WebRTC
- Room-based connection management
- Modern UI built with Next.js
- TypeScript for type safety
- Scalable backend architecture
- Redis-ready architecture for distributed messaging (planned)
- Authentication & message persistence (planned)

---

## 🛠 Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS / UI Components
- WebRTC for video streaming

### Backend
- Node.js
- TypeScript
- Raw WebSocket server
- Room management system

### Planned Integrations
- Redis (Pub/Sub for scaling WebSocket servers)
- Database (message & user persistence)
- Authentication system

---

# 📂 Project Structure

```bash
Omegle/
│
├── backend/
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts
│       ├── constant.ts
│       ├── index.ts
│       ├── room/
│       │   ├── Room.ts
│       │   └── RoomManager.ts
│       └── utils/
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [name]/
│   │       ├── page.tsx
│   │       └── video/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── scroll-area.tsx
│   │
│   ├── lib/
│   │   └── utils.ts
│   │
│   ├── public/
│   └── types/
│       ├── cache-life.d.ts
│       ├── routes.d.ts
│       └── validator.ts
│
└── .gitignore
```

---

# ⚙️ How It Works

### 1️⃣ WebSocket Signaling
The backend establishes WebSocket connections with clients.  
It manages user matchmaking and signaling required to establish WebRTC connections.

### 2️⃣ Room Management
The backend uses a **Room Manager system**:

- `RoomManager.ts` → Handles user matching and room allocation
- `Room.ts` → Manages communication between paired users

### 3️⃣ WebRTC Connection
After users are matched:

1. WebSocket exchanges **SDP offers and ICE candidates**
2. WebRTC establishes a **peer-to-peer connection**
3. Media streams are transferred directly between users

This reduces server load since video traffic **does not pass through the backend server**.

---

# 🖥 Running the Project

## 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/omegle-clone.git
cd omegle-clone
```

---

## 2️⃣ Start Backend

```bash
cd backend
npm install
npm run dev
```

---

## 3️⃣ Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Future Improvements

- Redis for distributed WebSocket scaling
- Authentication (JWT / OAuth)
- Message history persistence
- Online presence system
- Moderation and reporting tools
- WebRTC TURN/STUN server integration
- Mobile responsive improvements

---

## 📚 Learning Goals

This project focuses on understanding:

- Raw WebSocket implementation
- WebRTC signaling and peer-to-peer communication
- Real-time system architecture
- Scalable backend design
- Room-based matchmaking systems

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

Developed as a real-time communication system to explore **WebRTC, WebSockets, and scalable backend architecture**.