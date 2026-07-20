import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Upload, Image as ImageIcon, Sparkles, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CameraCaptureProps {
  onImageCaptured: (base64Image: string) => void;
  isLoading: boolean;
}

export default function CameraCapture({ onImageCaptured, isLoading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stopCamera();
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access camera. Please check permissions or ensure no other app is using it."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Match canvas dimensions to actual stream dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setPreviewImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, or JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmAnalysis = () => {
    if (previewImage) {
      onImageCaptured(previewImage);
    }
  };

  const resetCapture = () => {
    setPreviewImage(null);
    setCameraError(null);
    if (isCameraActive) {
      startCamera();
    }
  };

  return (
    <div id="camera-capture-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 id="capture-header" className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Scan / Upload Medication
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Align the pill imprint, bottle label, or prescription sheet for scanning.
          </p>
        </div>

        <div className="flex gap-2">
          {!previewImage && (
            <button
              id="toggle-camera-btn"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                isCameraActive
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
              }`}
              disabled={isLoading}
            >
              <Camera className="w-4 h-4" />
              {isCameraActive ? "Stop Camera" : "Use Camera"}
            </button>
          )}

          {isCameraActive && (
            <button
              id="flip-camera-btn"
              onClick={toggleFacingMode}
              className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              title="Flip camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div id="camera-error-alert" className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Camera Access Denied</p>
            <p className="text-xs text-amber-700 mt-0.5">{cameraError}</p>
          </div>
        </div>
      )}

      <div className="relative aspect-video w-full max-w-3xl mx-auto rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {previewImage ? (
            // Preview State
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full flex flex-col"
            >
              <img
                src={previewImage}
                alt="Captured medication preview"
                className="w-full h-full object-contain bg-slate-900"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md py-2.5 px-4 rounded-xl shadow-lg border border-white/10 z-10">
                <button
                  id="recapture-btn"
                  onClick={resetCapture}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  Retake / Reset
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button
                  id="confirm-analysis-btn"
                  onClick={confirmAnalysis}
                  className="px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Recognize with AI
                </button>
              </div>
            </motion.div>
          ) : isCameraActive ? (
            // Live Feed State
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full bg-slate-950"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover opacity-80"
              />
              
              {/* Guidance viewfinder overlay */}
              <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 pointer-events-none z-10">
                <div className="w-full h-full border-2 border-white/10 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-lg"></div>
                  
                  {/* Scanning Beam Graphic */}
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_15px_2px_rgba(59,130,246,0.5)] animate-pulse"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[9px] text-blue-400 font-bold bg-slate-950/80 font-mono tracking-widest px-2.5 py-1 rounded-full uppercase border border-blue-500/20">
                      Align Pill or Label Within Frame
                    </div>
                  </div>
                </div>
              </div>

              {/* Shutter button */}
              <button
                id="shutter-btn"
                onClick={capturePhoto}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white bg-blue-600 hover:bg-blue-500 shadow-lg cursor-pointer flex items-center justify-center transition-transform active:scale-95 z-20"
                title="Capture photograph"
              >
                <div className="w-10 h-10 rounded-full bg-transparent border-2 border-slate-900/10" />
              </button>
            </motion.div>
          ) : (
            // Upload Drag-and-Drop State
            <motion.label
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                dragActive ? "bg-blue-50/50 border-blue-400" : "hover:bg-slate-50 border-slate-200"
              }`}
            >
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                Drag and drop your medication image here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PNG, JPG, JPEG or capture a live frame
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-px w-8 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">OR</span>
                <span className="h-px w-8 bg-slate-200" />
              </div>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Browse Files
              </button>
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
