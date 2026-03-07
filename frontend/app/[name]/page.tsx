"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, SkipForward, LogOut, User as UserIcon } from "lucide-react";

type Message = {
  content: string;
  sender: "me" | "partner";
  timestamp: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080`);
    setSocket(ws);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "init", name }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "matched":
          setIsSearching(false);
          break;
        case "joined":
          setPartnerName(data.name);
          break;
        case "msg":
          setMessages((prev) => [
            ...prev,
            { content: data.content, sender: "partner", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ]);
          break;
        case "partner_left":
          setPartnerName(null);
          setIsSearching(true);
          setMessages([]);
          break;
        case "exit":
          router.push("/");
          break;
      }
    };

    return () => ws.close();
  }, [name, router]);

  const handleSendMessage = () => {
    if (!message.trim() || !socket || isSearching) return;

    socket.send(JSON.stringify({ type: "msg", content: message }));
    setMessages((prev) => [
      ...prev,
      { content: message, sender: "me", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setMessage("");
  };

  const handleNext = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: "next" }));
      setIsSearching(true);
      setPartnerName(null);
      setMessages([]);
    }
  };

  const handleExit = () => {
    if (socket) socket.send(JSON.stringify({ type: "leave" }));
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="text-primary w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base leading-none">{name} (You)</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isSearching ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
              <p className="text-xs text-muted-foreground">
                {isSearching ? "Searching for partner..." : `Chatting with ${partnerName || "Stranger"}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNext} className="hidden sm:flex items-center gap-2">
            <SkipForward className="w-4 h-4" /> Next
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExit} className="text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {isSearching ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 pt-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
              <p className="text-muted-foreground animate-pulse">Finding someone amazing for you to talk to...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground my-4 uppercase tracking-widest">Connected! Say hello.</p>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
                      msg.sender === "me" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border rounded-tl-none"
                    }`}>
                    <p className="text-sm md:text-base">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Footer Input */}
      <footer className="p-4 bg-card border-t">
        <div className="flex gap-2 items-center">
          {/* Mobile Next Button */}
          <Button variant="secondary" size="icon" onClick={handleNext} className="sm:hidden shrink-0">
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <Input
            value={message}
            disabled={isSearching}
            placeholder={isSearching ? "Waiting for a partner..." : "Type your message..."}
            className="flex-1 bg-muted/50 border-none focus-visible:ring-1"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          
          <Button 
            onClick={handleSendMessage} 
            disabled={isSearching || !message.trim()} 
            size="icon" 
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}