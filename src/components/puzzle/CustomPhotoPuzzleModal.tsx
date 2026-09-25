import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  X,
  Sparkles,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { PRESET_ARTWORKS } from '../../services/puzzleThemes';

interface CustomPhotoPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (dataUrl: string) => void;
  onOpenPhotoEditor?: () => void;
}

export const CustomPhotoPuzzleModal: React.FC<CustomPhotoPuzzleModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  onOpenPhotoEditor
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviewSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviewSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 }
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      alert('Camera access could not be initialized on this device.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewSrc(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirm = () => {
    if (previewSrc) {
      onSelectImage(previewSrc);
      stopCamera();
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Create Custom Photo Puzzle</h3>
              <p className="text-xs text-slate-400">Turn any memory into a playable brain teaser</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Mode */}
        {cameraActive ? (
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-black border-2 border-indigo-500 shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/40"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Photo</span>
              </button>
            </div>
          </div>
        ) : previewSrc ? (
          /* Preview Selected Image */
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl">
              <img
                src={previewSrc}
                alt="Puzzle preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewSrc(null)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white"
                title="Choose different photo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Photo loaded and ready to play!
            </p>
          </div>
        ) : (
          /* Dropzone & Actions */
          <div className="flex flex-col gap-4 mb-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white mb-1">
                Drop your photo here, or browse
              </div>
              <div className="text-xs text-slate-500">Supports JPG, PNG, WEBP</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Take Photo with Camera</span>
              </button>

              {onOpenPhotoEditor && (
                <button
                  onClick={() => {
                    handleClose();
                    onOpenPhotoEditor();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Edit in Photo Studio</span>
                </button>
              )}
            </div>

            {/* Quick preset gallery */}
            <div className="mt-2">
              <div className="text-[11px] uppercase font-bold text-slate-500 mb-2">
                Or pick from gallery:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_ARTWORKS.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setPreviewSrc(art.src)}
                    className="group relative rounded-xl overflow-hidden aspect-video border border-slate-800 hover:border-indigo-500 transition-all"
                  >
                    <img
                      src={art.src}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[9px] font-bold text-white truncate">
                        {art.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!previewSrc}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Puzzles</span>
          </button>
        </div>
      </div>
    </div>
  );
};
