"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  UserIcon,
  Video,
  VideoOff,
  Mic,
  MicOff,
  SkipForward,
  PhoneOff,
  MessageCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function Page() {
  const router = useRouter();
  const name = useParams().name;

  const decodedName = decodeURIComponent(name as string);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

useEffect(() => {
    if (videoRef.current && mediaStream) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.style.transform = "scaleX(-1)";
    }
}, [mediaStream]);

  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = videoOn;
      });
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });
    }
  }, [videoOn, micOn, mediaStream]);

  useEffect(() => {
    getMediaStream();
    // Here you would typically set up your WebRTC connection and handle the media stream
  }, []);

  useEffect(() => {
    const videoElement = document.querySelector("video");
    if (videoElement && mediaStream) {
      videoElement.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <div className="flex flex-col w-full h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Connected with</p>
            <p className="font-semibold text-lg">{decodedName}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${name}`)}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Chat
        </Button>
      </header>

      {/* Video Section */}
      <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-4 p-6">
        {/* Your Video */}
        <Card className="relative flex items-center justify-center bg-black rounded-xl overflow-hidden">
          <span className="text-muted-foreground text-sm absolute top-3 left-3">
            You
          </span>

          <video
            ref={videoRef}
            className="w-full relative z-20 h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {!videoOn && (
            <>
              <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" />
              <div className="text-gray-500 flex flex-col items-center gap-2">
                <VideoOff className="w-8 h-8 text-destructive" />
                <span>Your Video</span>
              </div>
            </>
          )}
        </Card>

        {/* Partner Video */}
        <Card className="relative flex items-center justify-center bg-black rounded-xl overflow-hidden">
          <span className="text-muted-foreground text-sm absolute top-3 left-3">
            Stranger
          </span>

          <div className="text-gray-500 flex flex-col items-center gap-2">
            <UserIcon className="w-8 h-8" />
            <span>Partner Video</span>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="border-t bg-card py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            size="icon"
            title="Mic"
            variant={micOn ? "secondary" : "outline"}
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5 text-destructive" />
            )}
          </Button>

          <Button
            size="icon"
            title="Video"
            variant={videoOn ? "secondary" : "outline"}
            onClick={() => setVideoOn(!videoOn)}
          >
            {videoOn ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5 text-destructive" />
            )}
          </Button>

          <Button size="icon" variant="default" title="Next">
            <SkipForward className="w-5 h-5" />
          </Button>

          <Button
            variant="destructive"
            title="End Call"
            onClick={() => router.push("/")}
          >
            End
          </Button>
        </div>
      </div>
    </div>
  );
}
