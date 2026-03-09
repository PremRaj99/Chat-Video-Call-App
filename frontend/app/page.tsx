"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Video, MessageSquare } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      router.push(`/${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <div className="flex relative items-center justify-center w-full min-h-screen p-4">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #14b8a6 100%)
      `,
          backgroundSize: "100% 100%",
        }}
      />
      {/* Glassmorphism Card container */}
      <div className="flex flex-col items-center">
        {/* Icon Header */}
        <div className="flex gap-4 mb-6">
          <div className="p-3 bg-white/20 rounded-2xl text-primary shadow-sm backdrop-blur-md">
            <Video className="w-8 h-8" />
          </div>
          <div className="p-3 bg-white/20 rounded-2xl text-primary shadow-sm backdrop-blur-md">
            <MessageSquare className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-primary tracking-tight drop-shadow-sm">
          Connect instantly.
        </h1>

        <p className="text-base sm:text-lg text-primary/60 mb-8 font-medium leading-relaxed text-center max-w-xl px-2 relative z-10">
          Meet new people, chat in real-time, and start a video call with a
          single click.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Enter your name to join..."
              value={name}
              className="py-6"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="relative w-full">
            <Button
              variant="default"
              type="submit"
              size={"lg"}
              className="py-6 w-full"
              disabled={!name.trim()}
            >
              Start Chatting
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
