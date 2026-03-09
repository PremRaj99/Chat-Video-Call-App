"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import usePartnerName from "@/zustand/partnerName";
import { useSocket } from "@/components/providers/socket-provider";
import {
  MessageCircle,
  Mic,
  MicOff,
  PhoneOff,
  UserIcon,
  Video,
  VideoOff,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function VideoPage() {
  const router = useRouter();
  const params = useParams();
  const name = decodeURIComponent(params?.name as string);

  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const { socket, isConnected } = useSocket();
  const { partnerName } = usePartnerName();
  const displayPartnerName = partnerName || "Stranger";

  // Cleanup function to kill camera tracks
  const stopMediaTracks = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.style.transform = "scaleX(-1)";
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };
    initStream();

    return () => stopMediaTracks(); // Cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mediaStream) {
      mediaStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = videoOn));
      mediaStream.getAudioTracks().forEach((track) => (track.enabled = micOn));
    }
  }, [videoOn, micOn, mediaStream]);

  // WebRTC Setup
  useEffect(() => {
    if (!socket || !isConnected || !mediaStream) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = pc;

    mediaStream.getTracks().forEach((track) => pc.addTrack(track, mediaStream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: "ice_candidate", candidate: event.candidate }),
        );
      }
    };

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "send_offer":
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: "offer", sdp: offer }));
            break;
          case "offer":
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: "answer", sdp: answer }));
            break;
          case "answer":
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            break;
          case "ice_candidate":
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
        }
      } catch (err) {
        console.error("WebRTC Error:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    socket.send(JSON.stringify({ type: "video_ready" }));

    return () => {
      socket.removeEventListener("message", handleMessage);
      pc.close(); // Clean up peer connection
    };
  }, [socket, isConnected, mediaStream]);

  const endCall = () => {
    stopMediaTracks();
    router.push(`/${encodeURIComponent(name)}`);
  };

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
            <p className="font-semibold text-lg">{displayPartnerName}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={endCall} className="gap-2">
          <MessageCircle className="w-4 h-4" /> Back to Chat
        </Button>
      </header>

      {/* Video Section */}
      <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-4 p-6">
        <Card className="relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-lg">
          <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs absolute top-4 left-4 z-30 backdrop-blur-sm">
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
            <div className="absolute inset-0 bg-neutral-900 z-30 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <VideoOff className="w-12 h-12" />
              <span>Camera Off</span>
            </div>
          )}
        </Card>

        <Card className="relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-lg">
          <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs absolute top-4 left-4 z-30 backdrop-blur-sm">
            {displayPartnerName}
          </span>
          <video
            ref={remoteVideoRef}
            className="w-full relative z-20 h-full object-cover"
            autoPlay
            playsInline
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 z-10 bg-neutral-900">
            <UserIcon className="w-12 h-12" />
            <span>Connecting video...</span>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="border-t bg-card py-6">
        <div className="flex items-center justify-center gap-6">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full"
            variant={micOn ? "secondary" : "destructive"}
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>
          <Button
            size="icon"
            className="w-14 h-14 rounded-full"
            variant={videoOn ? "secondary" : "destructive"}
            onClick={() => setVideoOn(!videoOn)}
          >
            {videoOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>
          <Button
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
            onClick={endCall}
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
