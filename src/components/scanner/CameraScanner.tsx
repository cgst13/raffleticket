import React, { useRef, useState, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw, Upload, Keyboard, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface CameraScannerProps {
  onScanSuccess: (qrCodeData: string) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(true);
  const animationFrameId = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (scanning) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      // Successfully scanned QR!
      stopCamera();
      onScanSuccess(code.data);
      return;
    }

    if (scanning) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  }, [scanning, stopCamera, onScanSuccess]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError('Camera API is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // required for iOS safari
        await videoRef.current.play();
        setHasCamera(true);
        setScanning(true);
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      setCameraError('Camera access denied or unavailable. You can enter the code manually below.');
    }
  }, [scanFrame]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            onScanSuccess(code.data);
          } else {
            setCameraError('No readable QR code found in uploaded image.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Viewfinder Window */}
      <div className="relative aspect-square bg-neutral-950 rounded-2xl overflow-hidden shadow-xl border-2 border-neutral-800 flex items-center justify-center">
        {/* Hidden internal processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${hasCamera ? 'block' : 'hidden'}`}
          muted
          playsInline
        />

        {/* Overlay Guides if Camera is Active */}
        {hasCamera && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Target Box */}
            <div className="w-64 h-64 border-2 border-white/70 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#F97316] rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#F97316] rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#F97316] rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#F97316] rounded-br-lg" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#F97316] to-transparent animate-pulse shadow-[0_0_8px_#F97316] top-1/2" />
            </div>
            <div className="absolute bottom-6 text-white text-xs font-semibold bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
              Point camera at ticket QR code
            </div>
          </div>
        )}

        {/* Fallback View when camera unavailable */}
        {!hasCamera && (
          <div className="p-6 text-center space-y-3 text-neutral-400">
            <Camera className="w-12 h-12 mx-auto text-neutral-600" />
            <p className="text-xs">{cameraError || 'Initializing camera...'}</p>
            <Button variant="outline" size="sm" onClick={startCamera} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry Camera
            </Button>
          </div>
        )}
      </div>

      {/* Manual Input and File Upload Options */}
      <div className="space-y-3 p-4 bg-white rounded-xl border border-[#E5E5E5] text-xs">
        <div className="flex items-center gap-1.5 font-bold text-neutral-700 uppercase tracking-wider">
          <Keyboard className="w-4 h-4 text-neutral-500" />
          <span>Manual Code or Ticket Number</span>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter UUID or ticket number (e.g. 0003)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <Button variant="primary" size="sm" type="submit">
            Verify
          </Button>
        </form>

        <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">Or verify from image file:</span>
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-[#F97316] font-semibold hover:underline">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload QR Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      </div>
    </div>
  );
};
