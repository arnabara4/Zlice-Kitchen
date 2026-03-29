"use client";

import React, { useState, useRef, useCallback, memo } from "react";
import { Camera, StopCircle, RefreshCw, Upload, CheckCircle2, AlertCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const VideoUploader = memo(({ onUpload }: { onUpload: (file: File) => void }) => {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const file = new File([blob], "verification-video.webm", { type: "video/webm" });
        
        setVideoUrl(url);
        setVideoFile(file);
        onUpload(file);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      toast.success("Recording started");
    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("Could not access camera/microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File too large (max 50MB)");
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFile(file);
      onUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border-4 border-slate-200 dark:border-slate-800 shadow-2xl group">
        {!videoUrl && !recording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="p-6 rounded-full bg-slate-800/50 mb-4 group-hover:scale-110 transition-transform">
              <Camera className="h-12 w-12" />
            </div>
            <p className="text-lg font-semibold text-slate-200">Showcase your packaging items</p>
            <p className="text-sm opacity-60 mt-2 max-w-xs transition-all">Ensure items are Disposable, Well Sealed, etc.</p>
          </div>
        )}

        <video 
          ref={videoRef} 
          src={videoUrl || undefined} 
          autoPlay 
          muted={recording}
          controls={!!videoUrl}
          className="w-full h-full object-cover"
        />

        {recording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white" />
            REC
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {!recording ? (
          <>
            <Button 
              size="lg" 
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 px-8 h-14 rounded-xl shadow-lg shadow-red-900/20"
            >
              <Camera className="h-5 w-5" />
              {videoUrl ? "Record Again" : "Start Recording"}
            </Button>
            
            <div className="relative">
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="video-upload"
              />
              <Button 
                variant="outline" 
                size="lg" 
                asChild
                className="h-14 px-8 rounded-xl border-2 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 cursor-pointer"
              >
                <label htmlFor="video-upload" className="flex items-center">
                  <Upload className="h-5 w-5" />
                  Upload Video
                </label>
              </Button>
            </div>
          </>
        ) : (
          <Button 
            size="lg" 
            variant="destructive"
            onClick={stopRecording}
            className="gap-2 px-12 h-14 rounded-xl shadow-xl animate-bounce"
          >
            <StopCircle className="h-5 w-5" />
            Stop Recording
          </Button>
        )}
      </div>

      {videoUrl && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-center gap-3 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-700 dark:text-green-400">Video captured successfully!</p>
            <p className="text-xs opacity-70">Review the preview above before submitting.</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setVideoUrl(null); setVideoFile(null); }}
            className="text-green-700 hover:bg-green-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      )}
    </div>
  );
});
