"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import useMessages from "@/zustand/messages";
import usePartnerName from "@/zustand/partnerName";
import { useSocket } from "@/components/providers/socket-provider";
import {
  Loader2,
  LogOut,
  Send,
  SkipForward,
  User as UserIcon,
  Video,
  PhoneCall,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(true);
  const [incomingCall, setIncomingCall] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);

  const { messages, setMessages, clearMessages } = useMessages();
  const { partnerName, setPartnerName } = usePartnerName();
  const { socket, isConnected } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Initialize user
    socket.send(JSON.stringify({ type: "init", name }));

    const messageListener = (event: MessageEvent) => {
      try {
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
              {
                content: data.content,
                sender: "partner",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
            break;
          case "partner_left":
            setPartnerName(null);
            setIsSearching(true);
            clearMessages();
            setIncomingCall(false);
            setIsWaitingForAnswer(false);
            break;
          case "video_call_request":
            setIncomingCall(true);
            break;
          case "video_call_accepted":
            router.push(`/${encodeURIComponent(name)}/video`);
            break;
          case "video_call_rejected":
            setIsWaitingForAnswer(false);
            alert("Partner declined the video call.");
            break;
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    socket.addEventListener("message", messageListener);
    return () => socket.removeEventListener("message", messageListener);
  }, [
    socket,
    isConnected,
    name,
    router,
    setMessages,
    setPartnerName,
    clearMessages,
  ]);

  const handleSendMessage = () => {
    if (!message.trim() || !socket || isSearching) return;
    socket.send(JSON.stringify({ type: "msg", content: message }));
    setMessages((prev) => [
      ...prev,
      {
        content: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setMessage("");
  };

  const handleNext = () => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: "next" }));
      setIsSearching(true);
      setPartnerName(null);
      clearMessages();
      setIncomingCall(false);
      setIsWaitingForAnswer(false);
    }
  };

  const handleExit = () => {
    if (socket && isConnected) socket.send(JSON.stringify({ type: "leave" }));
    router.push("/");
  };

  const initiateVideoCall = () => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: "video_call_request" }));
      setIsWaitingForAnswer(true);
    }
  };

  const acceptCall = () => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: "video_call_accepted" }));
      setIncomingCall(false);
      router.push(`/${encodeURIComponent(name)}/video`);
    }
  };

  const rejectCall = () => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: "video_call_rejected" }));
      setIncomingCall(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background shadow-2xl relative">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border shadow-2xl rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
              <PhoneCall className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Incoming Video Call</h2>
            <p className="text-muted-foreground mb-8">
              {partnerName || "Stranger"} wants to start a video call.
            </p>
            <div className="flex gap-4 w-full justify-center">
              <Button
                variant="destructive"
                className="w-full"
                onClick={rejectCall}
              >
                <X className="w-4 h-4 mr-2" /> Decline
              </Button>
              <Button
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={acceptCall}
              >
                <Video className="w-4 h-4 mr-2" /> Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="text-primary w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base leading-none">
              {name} (You)
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${!isConnected ? "bg-red-500" : isSearching ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}
              />
              <p className="text-xs text-muted-foreground">
                {!isConnected
                  ? "Disconnected..."
                  : isSearching
                    ? "Searching for partner..."
                    : `Chatting with ${partnerName || "Stranger"}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={initiateVideoCall}
            disabled={isSearching || isWaitingForAnswer || !isConnected}
            className="hidden sm:flex items-center gap-2"
          >
            {isWaitingForAnswer ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Calling...
              </>
            ) : (
              <>
                <Video className="w-4 h-4" /> Video Call
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="hidden sm:flex items-center gap-2"
            disabled={!isConnected}
          >
            <SkipForward className="w-4 h-4" /> Next
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden relative bg-muted/20">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {isSearching || !isConnected ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 pt-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
              <p className="text-muted-foreground animate-pulse">
                {!isConnected
                  ? "Connecting to server..."
                  : "Finding someone amazing for you to talk to..."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground my-4 uppercase tracking-widest">
                  Connected! Say hello.
                </p>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender === "me" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"}`}
                  >
                    <p className="text-sm md:text-base">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Footer Input */}
      <footer className="p-4 bg-card border-t z-10">
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={initiateVideoCall}
            disabled={isSearching || isWaitingForAnswer || !isConnected}
            className="sm:hidden shrink-0"
          >
            {isWaitingForAnswer ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleNext}
            className="sm:hidden shrink-0"
            disabled={!isConnected}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Input
            value={message}
            disabled={isSearching || !isConnected}
            placeholder={
              isSearching ? "Waiting for a partner..." : "Type your message..."
            }
            className="flex-1 bg-muted/50 border-none focus-visible:ring-1"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSearching || !message.trim() || !isConnected}
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
