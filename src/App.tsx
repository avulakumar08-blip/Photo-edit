import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  Sliders,
  Sparkles,
  Type,
  Smile,
  Brush,
  Download,
  Share2,
  ArrowLeft,
  Undo2,
  Redo2,
  Camera,
  RefreshCw,
  Eye,
  FolderOpen,
  User as UserIcon,
  Settings as SettingsIcon,
  Check,
  X,
  Smartphone,
  Cloud,
  Layers,
  Zap,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  EditorSettings,
  defaultEditorSettings,
  renderEditedCanvas,
  FilterCategory,
  EffectKind,
  FrameKind,
  TextOverlay,
  StickerOverlay,
  DrawStroke,
  AspectRatioType
} from './services/imageProcessing';
import {
  initAuth,
  googleSignIn,
  logout,
  uploadImageToDrive,
  listDriveImages,
  fetchDriveFileBlob,
  getAccessToken,
  DriveFileItem
} from './services/googleDrive';
import {
  getSavedProjects,
  saveProject,
  deleteProject,
  renameProject,
  LocalProject
} from './services/projectStorage';
import { generateAndroidProjectZip } from './services/androidProjectZip';

// Sample High-Resolution Photos for instant prototyping
const SAMPLE_PHOTOS = [
  {
    id: 'sample-portrait',
    title: 'Portrait Glow',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    category: 'Portrait'
  },
  {
    id: 'sample-nature',
    title: 'Mountain Lake',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    category: 'Landscape'
  },
  {
    id: 'sample-urban',
    title: 'Neon Cyber City',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80',
    category: 'Urban'
  },
  {
    id: 'sample-coffee',
    title: 'Morning Brew',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
    category: 'Lifestyle'
  }
];

const STICKER_CATEGORIES: Record<string, string[]> = {
  Emoji: ['😀', '🔥', '✨', '❤️', '🌟', '🕶️', '🚀', '💯', '🌈', '🎉', '⚡', '🤩'],
  Love: ['💖', '💕', '💘', '🌹', '💌', '😍', '💐', '💋', '🥰', '💍'],
  Travel: ['✈️', '🏖️', '🌴', '🗺️', '📸', '🎒', '🏔️', '🚂', '⛺', '🌅'],
  Food: ['🍕', '🍔', '🍦', '🍩', '🥑', '🍓', '🍣', '☕', '🧁', '🍹'],
  Celebration: ['🎈', '🎊', '🎂', '🥳', '🎁', '🍾', '🎇', '👑', '🥇'],
  Shapes: ['⭐', '🔷', '🔶', '⭕', '🔺', '💠', '✦', '✧', '■', '●']
};

export default function App() {
  // Navigation Screen States
  type Screen =
    | 'splash'
    | 'onboarding'
    | 'home'
    | 'gallery'
    | 'camera'
    | 'editor'
    | 'export'
    | 'projects'
    | 'profile'
    | 'settings';

  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Active Photo & Image element
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Non-destructive Editor Settings & History
  const [settings, setSettings] = useState<EditorSettings>(defaultEditorSettings);
  const [history, setHistory] = useState<EditorSettings[]>([defaultEditorSettings]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Editor Active Tab
  type EditorTab =
    | 'none'
    | 'crop'
    | 'adjust'
    | 'filters'
    | 'effects'
    | 'text'
    | 'stickers'
    | 'draw'
    | 'blur'
    | 'frames'
    | 'ai';
  const [activeTab, setActiveTab] = useState<EditorTab>('none');
  const [holdCompare, setHoldCompare] = useState<boolean>(false);

  // Adjustments sub-selection
  const [activeAdjustParam, setActiveAdjustParam] = useState<string>('brightness');

  // Drawing mode state
  const [drawColor, setDrawColor] = useState<string>('#6366F1');
  const [drawSize, setDrawSize] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isDrawingNow, setIsDrawingNow] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<DrawStroke | null>(null);

  // Text Tool editing modal
  const [editingTextLayer, setEditingTextLayer] = useState<TextOverlay | null>(null);

  // Export parameters
  const [exportFormat, setExportFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [exportQuality, setExportQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const [exportResolution, setExportResolution] = useState<'original' | '1080p' | '2k' | '4k'>('original');
  const [beforeAfterSplit, setBeforeAfterSplit] = useState<number>(50);

  // Saved Projects
  const [projectsList, setProjectsList] = useState<LocalProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Google Drive & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState<boolean>(false);
  const [driveConfirmModal, setDriveConfirmModal] = useState<{ open: boolean; blob: Blob | null; name: string }>({
    open: false,
    blob: null,
    name: ''
  });
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveNotification, setDriveNotification] = useState<string | null>(null);

  // Android Studio Code Explorer / APK Dialog
  const [showAndroidCodeModal, setShowAndroidCodeModal] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  // AI Dialog
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Web Camera Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Canvas Refs
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Splash Screen Auto Advance
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        const hasOnboarded = localStorage.getItem('photo_editor_onboarded');
        setCurrentScreen(hasOnboarded ? 'home' : 'onboarding');
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // 2. Init Firebase Auth & Saved Projects
  useEffect(() => {
    setProjectsList(getSavedProjects());
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Load Image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // 4. Update Canvas when settings or loadedImage change
  const refreshCanvas = useCallback(() => {
    if (!loadedImage || !editorCanvasRef.current) return;
    renderEditedCanvas(
      loadedImage,
      holdCompare ? defaultEditorSettings : settings,
      editorCanvasRef.current
    );
  }, [loadedImage, settings, holdCompare]);

  useEffect(() => {
    refreshCanvas();
  }, [refreshCanvas]);

  // Push new settings state to history
  const updateSettings = (newSettings: Partial<EditorSettings>, pushToHistory: boolean = false) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (pushToHistory) {
        const nextHistory = history.slice(0, historyIndex + 1);
        nextHistory.push(JSON.parse(JSON.stringify(updated)));
        setHistory(nextHistory);
        setHistoryIndex(nextHistory.length - 1);
      }
      return updated;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setSettings(JSON.parse(JSON.stringify(history[targetIndex])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setSettings(JSON.parse(JSON.stringify(history[targetIndex])));
    }
  };

  // Start Editing Image
  const startEditing = (src: string, existingSettings?: EditorSettings, projectId?: string) => {
    setImageSrc(src);
    const initial = existingSettings ? JSON.parse(JSON.stringify(existingSettings)) : defaultEditorSettings;
    setSettings(initial);
    setHistory([initial]);
    setHistoryIndex(0);
    setActiveProjectId(projectId || null);
    setCurrentScreen('editor');
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Camera access not available or permission denied.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (currentScreen === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentScreen, cameraFacing]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopCamera();
      startEditing(dataUrl);
    }
  };

  // Google Drive integration
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        loadDriveFiles();
      }
    } catch (err) {
      console.error(err);
      alert('Google authentication failed.');
    }
  };

  const loadDriveFiles = async () => {
    setIsDriveLoading(true);
    try {
      const files = await listDriveImages();
      setDriveFiles(files);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const selectDriveImage = async (file: DriveFileItem) => {
    try {
      const blob = await fetchDriveFileBlob(file.id);
      const url = URL.createObjectURL(blob);
      startEditing(url);
    } catch (err: any) {
      alert(err.message || 'Failed to open Drive photo.');
    }
  };

  // Export & Download
  const generateExportBlob = async (): Promise<Blob | null> => {
    if (!loadedImage) return null;
    const maxDims = {
      original: undefined,
      '1080p': 1920,
      '2k': 2560,
      '4k': 3840
    }[exportResolution];

    const temp = document.createElement('canvas');
    renderEditedCanvas(loadedImage, settings, temp, maxDims);

    const mime = exportFormat === 'png' ? 'image/png' : exportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const qualityNumber = exportQuality === 'standard' ? 0.8 : exportQuality === 'high' ? 0.92 : 1.0;

    return new Promise((resolve) => {
      temp.toBlob((blob) => resolve(blob), mime, qualityNumber);
    });
  };

  const downloadToDevice = async () => {
    const blob = await generateExportBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PhotoEditor_${Date.now()}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharePhoto = async () => {
    const blob = await generateExportBlob();
    if (!blob) return;
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'photo.jpg')] })) {
      try {
        await navigator.share({
          title: 'Edited with Photo Editor',
          files: [new File([blob], `photo.${exportFormat}`, { type: blob.type })]
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      downloadToDevice();
    }
  };

  // Save Project Locally
  const handleSaveProject = () => {
    if (!editorCanvasRef.current || !imageSrc) return;
    const thumb = editorCanvasRef.current.toDataURL('image/jpeg', 0.6);
    const p = saveProject('My Edit', imageSrc, thumb, settings, activeProjectId || undefined);
    setActiveProjectId(p.id);
    setProjectsList(getSavedProjects());
    alert('Project saved successfully! You can resume it anytime.');
  };

  // Google Drive Upload with Mandatory Confirmation Modal
  const initiateDriveUpload = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleGoogleSignIn();
    }
    const blob = await generateExportBlob();
    if (!blob) return;

    setDriveConfirmModal({
      open: true,
      blob,
      name: `PhotoEditor_${Date.now()}.${exportFormat}`
    });
  };

  const confirmUploadToDrive = async () => {
    if (!driveConfirmModal.blob) return;
    setIsUploadingToDrive(true);
    try {
      const res = await uploadImageToDrive(driveConfirmModal.blob, driveConfirmModal.name);
      setDriveConfirmModal({ open: false, blob: null, name: '' });
      setDriveNotification(`Successfully saved to your Google Drive as "${res.name}"!`);
      setTimeout(() => setDriveNotification(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Drive upload failed.');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Download Android Studio ZIP
  const handleDownloadAndroidZip = async () => {
    setIsDownloadingZip(true);
    try {
      const blob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PhotoEditor-AndroidStudio-Project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Android project zip.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#09090C] text-zinc-100' : 'bg-zinc-100 text-zinc-900'} flex flex-col font-sans transition-colors duration-200 select-none overflow-x-hidden`}>
      {/* Top AI Studio Header & Android Studio APK Toolbar */}
      <header className="w-full bg-[#121217] border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-300 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            PE
          </div>
          <div>
            <div className="font-semibold text-zinc-100 flex items-center gap-2">
              Photo Editor
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-700/50 text-[10px] px-1.5 py-0.5 rounded font-mono">
                Kotlin • Compose • APK
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 hidden sm:block">
              Android 8.0 - 15 (API 35) • CameraX • MediaStore • Google Drive
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* APK Project Zip Download */}
          <button
            onClick={handleDownloadAndroidZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloadingZip ? 'Generating...' : 'Export Android APK Project (.zip)'}
          </button>

          {/* Android Code Explorer Button */}
          <button
            onClick={() => setShowAndroidCodeModal(true)}
            className="hidden md:flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-700/70 transition"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Code & APK Guide</span>
          </button>

          {/* Device Frame Viewport Toggle */}
          <button
            onClick={() => setDeviceFrameMode(!deviceFrameMode)}
            className={`p-1.5 rounded-lg border transition ${
              deviceFrameMode
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
            title={deviceFrameMode ? 'Switch to responsive full-screen' : 'Switch to mobile device frame'}
          >
            {deviceFrameMode ? <Smartphone className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-0 sm:p-4">
        <div
          className={`relative transition-all duration-300 ${
            deviceFrameMode
              ? 'w-full max-w-[420px] h-[860px] max-h-[96vh] rounded-[44px] border-[10px] border-[#22222B] shadow-2xl shadow-black/80 flex flex-col bg-[#0F0F14] overflow-hidden ring-1 ring-zinc-700/50'
              : 'w-full max-w-4xl h-[92vh] rounded-2xl border border-zinc-800 flex flex-col bg-[#0F0F14] overflow-hidden'
          }`}
        >
          {/* Android System Status Bar (Clock, Camera Notch, WiFi, Battery) */}
          <div className="w-full h-8 px-6 pt-1 flex items-center justify-between text-[11px] font-medium text-zinc-300 z-40 bg-transparent shrink-0">
            <span>9:41</span>
            {deviceFrameMode && (
              <div className="w-20 h-4 bg-black rounded-full border border-zinc-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700"></div>
              </div>
            )}
            <div className="flex items-center space-x-1.5">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-zinc-400 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Drive Notification Banner */}
          {driveNotification && (
            <div className="absolute top-9 left-4 right-4 z-50 bg-emerald-600 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                <span>{driveNotification}</span>
              </div>
              <button onClick={() => setDriveNotification(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SCREEN 1: SPLASH SCREEN */}
          {currentScreen === 'splash' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Photo Editor</h1>
              <p className="text-zinc-400 text-sm max-w-xs">Pro Mobile Photo Editing Studio with Non-Destructive Engine</p>
              <div className="mt-8 flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}

          {/* SCREEN 2: ONBOARDING SCREEN */}
          {currentScreen === 'onboarding' && (
            <div className="flex-1 flex flex-col justify-between p-6 animate-fadeIn">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    localStorage.setItem('photo_editor_onboarded', 'true');
                    setCurrentScreen('home');
                  }}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                >
                  Skip
                </button>
              </div>

              <div className="flex flex-col items-center text-center px-4">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                  <Crop className="w-12 h-12 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Non-Destructive Editing</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Crop, rotate, adjust tone, apply cinematic filters, add text & stickers, and draw freely. Your original photo is always preserved.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-1.5 mb-2">
                  <div className="w-6 h-1.5 rounded-full bg-indigo-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('photo_editor_onboarded', 'true');
                    setCurrentScreen('home');
                  }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: HOME SCREEN */}
          {currentScreen === 'home' && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3">
              {/* Home Header */}
              <div className="flex items-center justify-between py-2 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-white">Photo Editor</h1>
                  <p className="text-xs text-zinc-400">Mobile Creator Studio</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentScreen('profile')}
                    className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                    title="Profile"
                  >
                    <UserIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('settings')}
                    className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                    title="Settings"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Button: + Create New Edit */}
              <button
                onClick={() => setCurrentScreen('gallery')}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-[0.98] transition mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span>Create New Edit</span>
              </button>

              {/* Two Large Action Buttons: Gallery & Camera */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setCurrentScreen('gallery')}
                  className="bg-[#181822] hover:bg-[#20202d] border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between h-28 text-left transition active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Gallery</div>
                    <div className="text-[11px] text-zinc-400">Import photo</div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentScreen('camera')}
                  className="bg-[#181822] hover:bg-[#20202d] border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between h-28 text-left transition active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Camera</div>
                    <div className="text-[11px] text-zinc-400">Capture now</div>
                  </div>
                </button>
              </div>

              {/* Quick Tools Section */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Quick Tools</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Crop', icon: Crop, color: 'text-blue-400 bg-blue-500/10' },
                    { label: 'Adjust', icon: Sliders, color: 'text-emerald-400 bg-emerald-500/10' },
                    { label: 'Filters', icon: Palette, color: 'text-amber-400 bg-amber-500/10' },
                    { label: 'Text', icon: Type, color: 'text-pink-400 bg-pink-500/10' },
                    { label: 'Effects', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10' },
                    { label: 'AI Tools', icon: Zap, color: 'text-cyan-400 bg-cyan-500/10' }
                  ].map((tool) => (
                    <button
                      key={tool.label}
                      onClick={() => setCurrentScreen('gallery')}
                      className="bg-[#161620] hover:bg-[#1e1e2c] border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center gap-1.5 transition active:scale-95"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tool.color}`}>
                        <tool.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-zinc-300">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Projects Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Projects</span>
                  <button
                    onClick={() => setCurrentScreen('projects')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    See all ({projectsList.length})
                  </button>
                </div>

                {projectsList.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {projectsList.slice(0, 2).map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => startEditing(proj.imageSource, proj.settings, proj.id)}
                        className="bg-[#181822] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500/50 transition group"
                      >
                        <div className="h-24 bg-zinc-900 overflow-hidden relative">
                          <img
                            src={proj.thumbnailUrl || proj.imageSource}
                            alt={proj.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="p-2.5">
                          <div className="font-semibold text-xs text-white truncate">{proj.name}</div>
                          <div className="text-[10px] text-zinc-400">
                            {new Date(proj.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setCurrentScreen('gallery')}
                    className="bg-[#161620] border border-dashed border-zinc-800 rounded-2xl p-5 text-center cursor-pointer hover:border-zinc-700 transition"
                  >
                    <FolderOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <div className="text-xs font-medium text-zinc-300">No saved drafts yet</div>
                    <div className="text-[11px] text-zinc-500">Pick a photo to start creating</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN 4: GALLERY PICKER */}
          {currentScreen === 'gallery' && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3 animate-fadeIn">
              <div className="flex items-center gap-3 py-2 mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Select Photo</h2>
              </div>

              {/* Upload from Device */}
              <label className="w-full p-6 bg-gradient-to-br from-indigo-950/40 to-zinc-900/80 border-2 border-dashed border-indigo-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 transition mb-5 text-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => startEditing(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <Download className="w-6 h-6 rotate-180" />
                </div>
                <div className="font-semibold text-sm text-white">Upload from Device</div>
                <div className="text-[11px] text-zinc-400">Tap to browse JPG, PNG, WEBP files</div>
              </label>

              {/* Google Drive Integration Section */}
              <div className="bg-[#181824] border border-zinc-800/80 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-xs text-white">Google Drive Photos</div>
                      <div className="text-[10px] text-zinc-400">Import your cloud-synced photos</div>
                    </div>
                  </div>
                  {!currentUser ? (
                    <button
                      onClick={handleGoogleSignIn}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      onClick={loadDriveFiles}
                      className="p-1.5 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg"
                      title="Refresh Drive files"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDriveLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>

                {currentUser && (
                  <div>
                    {isDriveLoading ? (
                      <div className="text-center py-4 text-xs text-zinc-400">Connecting to Google Drive...</div>
                    ) : driveFiles.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {driveFiles.map((df) => (
                          <div
                            key={df.id}
                            onClick={() => selectDriveImage(df)}
                            className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl cursor-pointer hover:border-cyan-500/50 flex items-center gap-2"
                          >
                            <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span className="text-xs text-zinc-200 truncate">{df.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 py-2">
                        Connected as {currentUser.email}. No images found or click refresh to sync.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sample Studio Photos */}
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Or Try Sample Pro Photos
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SAMPLE_PHOTOS.map((sp) => (
                    <div
                      key={sp.id}
                      onClick={() => startEditing(sp.url)}
                      className="h-32 rounded-xl overflow-hidden relative cursor-pointer group border border-zinc-800/80"
                    >
                      <img src={sp.url} alt={sp.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-xs font-semibold text-white drop-shadow">{sp.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 5: CAMERA SCREEN */}
          {currentScreen === 'camera' && (
            <div className="flex-1 flex flex-col justify-between bg-black relative animate-fadeIn overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Camera Header */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-xs font-semibold bg-black/40 text-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  Live Camera
                </div>
                <button
                  onClick={() => setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {cameraError && (
                <div className="relative z-10 m-6 p-4 bg-zinc-900/90 border border-zinc-700 rounded-2xl text-center">
                  <p className="text-xs text-zinc-300 mb-3">{cameraError}</p>
                  <button
                    onClick={() => setCurrentScreen('gallery')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Select Photo from Gallery
                  </button>
                </div>
              )}

              {/* Camera Shutter Bar */}
              <div className="relative z-10 p-6 flex items-center justify-around bg-gradient-to-t from-black/80 to-transparent">
                <button
                  onClick={() => setCurrentScreen('gallery')}
                  className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>

                {/* Big Shutter Button */}
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white p-1.5 flex items-center justify-center active:scale-95 transition"
                >
                  <div className="w-full h-full rounded-full bg-white"></div>
                </button>

                <div className="w-12 h-12"></div>
              </div>
            </div>
          )}

          {/* SCREEN 6: PHOTO EDITOR (MAIN ENGINE) */}
          {currentScreen === 'editor' && (
            <div className="flex-1 flex flex-col justify-between bg-[#0B0B0E] relative overflow-hidden">
              {/* TOP BAR */}
              <div className="h-12 px-3 border-b border-zinc-800/80 bg-[#121217] flex items-center justify-between z-20 shrink-0">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 text-zinc-300"
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30 text-zinc-300"
                    title="Redo"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={() => setHoldCompare(true)}
                    onMouseUp={() => setHoldCompare(false)}
                    onTouchStart={() => setHoldCompare(true)}
                    onTouchEnd={() => setHoldCompare(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      holdCompare ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Compare</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveProject}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                    title="Save Draft"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('export')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                  >
                    Export
                  </button>
                </div>
              </div>

              {/* CENTER: LARGE PHOTO CANVAS */}
              <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-black/60">
                <canvas
                  ref={editorCanvasRef}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />

                {/* Freehand Drawing Overlay Canvas */}
                {activeTab === 'draw' && (
                  <div
                    className="absolute inset-0 z-30 cursor-crosshair"
                    onMouseDown={(e) => {
                      setIsDrawingNow(true);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setCurrentStroke({
                        points: [{ x, y }],
                        color: drawColor,
                        size: drawSize,
                        isEraser
                      });
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawingNow || !currentStroke) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      const updated = {
                        ...currentStroke,
                        points: [...currentStroke.points, { x, y }]
                      };
                      setCurrentStroke(updated);
                    }}
                    onMouseUp={() => {
                      if (currentStroke && currentStroke.points.length > 1) {
                        updateSettings({ drawStrokes: [...settings.drawStrokes, currentStroke] }, true);
                      }
                      setIsDrawingNow(false);
                      setCurrentStroke(null);
                    }}
                  />
                )}
              </div>

              {/* BOTTOM: CONTEXTUAL SUB-TOOL PANEL */}
              <div className="bg-[#14141B] border-t border-zinc-800/80 z-20 shrink-0">
                {/* 1. Crop Subpanel */}
                {activeTab === 'crop' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Crop & Aspect Ratio</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2">
                      {(['original', '1:1', '4:5', '16:9', '9:16', 'free'] as AspectRatioType[]).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => {
                            let box = null;
                            if (ratio === '1:1') box = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
                            else if (ratio === '4:5') box = { x: 0.15, y: 0.05, width: 0.7, height: 0.875 };
                            else if (ratio === '16:9') box = { x: 0.05, y: 0.2, width: 0.9, height: 0.5 };
                            else if (ratio === '9:16') box = { x: 0.2, y: 0.05, width: 0.56, height: 0.9 };
                            updateSettings({ aspectRatio: ratio, cropBox: box }, true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${
                            settings.aspectRatio === ratio
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-around pt-1 border-t border-zinc-800/40">
                      <button
                        onClick={() => updateSettings({ rotation: (settings.rotation + 90) % 360 }, true)}
                        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Rotate 90°</span>
                      </button>
                      <button
                        onClick={() => updateSettings({ flipH: !settings.flipH }, true)}
                        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>Flip H</span>
                      </button>
                      <button
                        onClick={() => updateSettings({ flipV: !settings.flipV }, true)}
                        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>Flip V</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Adjustments Subpanel */}
                {activeTab === 'adjust' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white capitalize">
                        {activeAdjustParam}: {settings[activeAdjustParam as keyof EditorSettings] as number}
                      </span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-3 px-1 mb-3">
                      <span className="text-[10px] text-zinc-500 font-mono">-100</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={settings[activeAdjustParam as keyof EditorSettings] as number}
                        onChange={(e) => updateSettings({ [activeAdjustParam]: parseInt(e.target.value) })}
                        onMouseUp={() => updateSettings({}, true)}
                        className="flex-1 accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-500 font-mono">+100</span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {[
                        'brightness',
                        'contrast',
                        'saturation',
                        'exposure',
                        'highlights',
                        'shadows',
                        'temperature',
                        'sharpness',
                        'blur'
                      ].map((param) => (
                        <button
                          key={param}
                          onClick={() => setActiveAdjustParam(param)}
                          className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap ${
                            activeAdjustParam === param
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {param}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Filters Subpanel */}
                {activeTab === 'filters' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Photographic Filters</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    {settings.filter !== 'original' && (
                      <div className="flex items-center gap-2 px-1 mb-2">
                        <span className="text-[11px] text-zinc-400">Intensity</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.filterIntensity}
                          onChange={(e) => updateSettings({ filterIntensity: parseFloat(e.target.value) }, true)}
                          className="flex-1 accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-[11px] text-zinc-200 font-mono">
                          {Math.round(settings.filterIntensity * 100)}%
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {[
                        { id: 'original', name: 'Original' },
                        { id: 'natural', name: 'Natural' },
                        { id: 'portrait', name: 'Portrait' },
                        { id: 'cinematic', name: 'Cinematic' },
                        { id: 'vintage', name: 'Vintage' },
                        { id: 'warm', name: 'Warm' },
                        { id: 'cool', name: 'Cool' },
                        { id: 'black_white', name: 'B&W' },
                        { id: 'dramatic', name: 'Dramatic' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => updateSettings({ filter: f.id as FilterCategory }, true)}
                          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${
                            settings.filter === f.id
                              ? 'bg-cyan-600 text-white font-bold ring-2 ring-cyan-400/50'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Effects Subpanel */}
                {activeTab === 'effects' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Visual FX</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {[
                        { id: 'none', label: 'None' },
                        { id: 'vignette', label: 'Vignette' },
                        { id: 'light_leak', label: 'Light Leak' },
                        { id: 'glow', label: 'Glow' },
                        { id: 'grain', label: 'Grain' },
                        { id: 'noise', label: 'Noise' },
                        { id: 'color_overlay', label: 'Color Overlay' }
                      ].map((eff) => (
                        <button
                          key={eff.id}
                          onClick={() => updateSettings({ effect: eff.id as EffectKind }, true)}
                          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${
                            settings.effect === eff.id
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {eff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Text Subpanel */}
                {activeTab === 'text' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Text Typography</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newText: TextOverlay = {
                            id: 'text_' + Date.now(),
                            text: 'Double tap to edit',
                            x: 50,
                            y: 50,
                            fontSize: 32,
                            color: '#FFFFFF',
                            isBold: true,
                            isItalic: false,
                            hasBackground: true,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            rotation: 0
                          };
                          updateSettings({ textLayers: [...settings.textLayers, newText] }, true);
                          setEditingTextLayer(newText);
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Text Box</span>
                      </button>

                      {settings.textLayers.length > 0 && (
                        <button
                          onClick={() => updateSettings({ textLayers: [] }, true)}
                          className="px-3 py-2 bg-zinc-800 hover:bg-rose-900/40 text-rose-400 rounded-xl text-xs font-semibold"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Stickers Subpanel */}
                {activeTab === 'stickers' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Stickers & Emojis</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {Object.values(STICKER_CATEGORIES)
                        .flat()
                        .slice(0, 16)
                        .map((symbol, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const newSticker: StickerOverlay = {
                                id: 'sticker_' + Date.now(),
                                symbol,
                                x: 50,
                                y: 50,
                                scale: 1.2,
                                rotation: 0
                              };
                              updateSettings({ stickers: [...settings.stickers, newSticker] }, true);
                            }}
                            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xl shrink-0 active:scale-95"
                          >
                            {symbol}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* 7. Draw Subpanel */}
                {activeTab === 'draw' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Freehand Painting</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => setIsEraser(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          !isEraser ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        Brush
                      </button>
                      <button
                        onClick={() => setIsEraser(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          isEraser ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        Eraser
                      </button>
                      <button
                        onClick={() => updateSettings({ drawStrokes: [] }, true)}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-white"
                      >
                        Clear
                      </button>

                      {/* Color Palette */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        {['#6366F1', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#FFFFFF'].map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setDrawColor(c);
                              setIsEraser(false);
                            }}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border-2 ${
                              drawColor === c && !isEraser ? 'border-white scale-110' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Frames Subpanel */}
                {activeTab === 'frames' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Borders & Frames</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {[
                        { id: 'none', label: 'None' },
                        { id: 'simple', label: 'Simple' },
                        { id: 'modern', label: 'Modern' },
                        { id: 'polaroid', label: 'Polaroid' },
                        { id: 'classic', label: 'Classic' },
                        { id: 'social', label: 'Social' }
                      ].map((frame) => (
                        <button
                          key={frame.id}
                          onClick={() => updateSettings({ frame: frame.id as FrameKind }, true)}
                          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${
                            settings.frame === frame.id
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {frame.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. AI Tools Subpanel */}
                {activeTab === 'ai' && (
                  <div className="p-3 border-b border-zinc-800/60 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">AI Tools (Future-Ready)</span>
                      <button onClick={() => setActiveTab('none')} className="text-xs text-cyan-400 font-semibold">
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {[
                        'AI Background Remover',
                        'AI Object Remover',
                        'AI Enhance',
                        'AI Upscale',
                        'AI Background Replacement',
                        'AI Portrait Enhancement'
                      ].map((tool) => (
                        <button
                          key={tool}
                          onClick={() =>
                            setAiNotice(
                              `AI service not configured.\nPlease configure a Gemini API key or model backend in Settings before using "${tool}".`
                            )
                          }
                          className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/60 rounded-xl text-xs text-zinc-200 whitespace-nowrap flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{tool}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SCROLLABLE BOTTOM MAIN TOOLBAR */}
                <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5 scrollbar-none">
                  {[
                    { id: 'crop', label: 'Crop', icon: Crop },
                    { id: 'adjust', label: 'Adjust', icon: Sliders },
                    { id: 'filters', label: 'Filters', icon: Palette },
                    { id: 'effects', label: 'Effects', icon: Sparkles },
                    { id: 'text', label: 'Text', icon: Type },
                    { id: 'stickers', label: 'Stickers', icon: Smile },
                    { id: 'draw', label: 'Draw', icon: Brush },
                    { id: 'frames', label: 'Frames', icon: Layers },
                    { id: 'ai', label: 'AI Tools', icon: Zap }
                  ].map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(isSelected ? 'none' : (tab.id as EditorTab))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[54px] shrink-0 ${
                          isSelected ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800/80'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 7: EXPORT / PREVIEW SCREEN */}
          {currentScreen === 'export' && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3 animate-fadeIn">
              <div className="flex items-center justify-between py-2 mb-3">
                <button
                  onClick={() => setCurrentScreen('editor')}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Preview & Export</h2>
                <button
                  onClick={() => setCurrentScreen('editor')}
                  className="text-xs text-indigo-400 font-semibold"
                >
                  Edit Again
                </button>
              </div>

              {/* Before / After Interactive Split Comparison */}
              <div className="w-full h-64 bg-black rounded-2xl overflow-hidden relative mb-4 border border-zinc-800 select-none">
                {/* Original background image */}
                {loadedImage && (
                  <img
                    src={loadedImage.src}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                )}

                {/* Edited image clipped to split slider */}
                {editorCanvasRef.current && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${beforeAfterSplit}%` }}
                  >
                    <img
                      src={editorCanvasRef.current.toDataURL()}
                      alt="Edited"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                )}

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none z-10"
                  style={{ left: `${beforeAfterSplit}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-zinc-900 shadow-md flex items-center justify-center text-[10px] font-bold">
                    ↔
                  </div>
                </div>

                {/* Invisible slider input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beforeAfterSplit}
                  onChange={(e) => setBeforeAfterSplit(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />

                <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 text-[10px] text-zinc-300 font-semibold">
                  Edited
                </div>
                <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded bg-black/60 text-[10px] text-zinc-300 font-semibold">
                  Original
                </div>
              </div>

              {/* Export Format Settings */}
              <div className="bg-[#181822] border border-zinc-800/80 rounded-2xl p-4 mb-4 space-y-3">
                {/* Format */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Image Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['jpg', 'png', 'webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition ${
                          exportFormat === fmt ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Compression Quality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['standard', 'high', 'ultra'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setExportQuality(q)}
                        className={`py-2 rounded-xl text-xs font-medium capitalize transition ${
                          exportQuality === q ? 'bg-cyan-600 text-white font-bold' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Output Resolution</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['original', '1080p', '2k', '4k'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setExportResolution(res)}
                        className={`py-1.5 rounded-xl text-xs font-medium uppercase transition ${
                          exportResolution === res ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save to Device, Share, Backup to Google Drive */}
              <div className="space-y-2.5 pb-6">
                <button
                  onClick={downloadToDevice}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Save to Device (MediaStore Gallery)</span>
                </button>

                <button
                  onClick={sharePhoto}
                  className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl font-bold text-sm border border-zinc-700/60 flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share (Android Sharesheet)</span>
                </button>

                <button
                  onClick={initiateDriveUpload}
                  disabled={isUploadingToDrive}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Cloud className="w-4 h-4" />
                  <span>{isUploadingToDrive ? 'Uploading to Drive...' : 'Save to Google Drive'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 8: PROJECTS SCREEN */}
          {currentScreen === 'projects' && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3 animate-fadeIn">
              <div className="flex items-center gap-3 py-2 mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Saved Projects & Drafts</h2>
              </div>

              {projectsList.length > 0 ? (
                <div className="space-y-3">
                  {projectsList.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#181822] border border-zinc-800 p-3 rounded-2xl flex items-center justify-between"
                    >
                      <div
                        onClick={() => startEditing(p.imageSource, p.settings, p.id)}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="w-14 h-14 rounded-xl bg-zinc-900 overflow-hidden shrink-0">
                          <img src={p.thumbnailUrl || p.imageSource} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-sm text-white truncate">{p.name}</div>
                          <div className="text-[11px] text-zinc-400">
                            Modified: {new Date(p.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          onClick={() => {
                            const newName = prompt('Enter new project name:', p.name);
                            if (newName) {
                              renameProject(p.id, newName);
                              setProjectsList(getSavedProjects());
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-white"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete project "${p.name}"?`)) {
                              deleteProject(p.id);
                              setProjectsList(getSavedProjects());
                            }
                          }}
                          className="p-2 text-rose-400 hover:text-rose-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                  <FolderOpen className="w-12 h-12 text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-300">No projects saved yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Start a new edit and tap save to keep drafts</p>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 9: PROFILE SCREEN */}
          {currentScreen === 'profile' && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3 animate-fadeIn">
              <div className="flex items-center gap-3 py-2 mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Profile & Account</h2>
              </div>

              <div className="flex flex-col items-center text-center py-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 mb-3 shadow-xl shadow-indigo-600/20">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white">
                  {currentUser?.displayName || 'Photo Studio Creator'}
                </h3>
                <p className="text-xs text-zinc-400">{currentUser?.email || 'Guest Session'}</p>
              </div>

              {/* Google Drive Status */}
              <div className="bg-[#181822] border border-zinc-800 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Google Drive Integration</div>
                      <div className="text-[11px] text-zinc-400">
                        {currentUser ? 'Connected with Cloud Storage' : 'Not Connected'}
                      </div>
                    </div>
                  </div>
                  {currentUser ? (
                    <button
                      onClick={async () => {
                        await logout();
                        setCurrentUser(null);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 text-xs text-rose-400 rounded-lg hover:bg-zinc-700"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      className="px-3 py-1.5 bg-cyan-600 text-xs font-bold text-white rounded-lg shadow-sm"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Statistics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#181822] border border-zinc-800 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-extrabold text-indigo-400 mb-1">{projectsList.length}</div>
                  <div className="text-xs text-zinc-400">Draft Projects</div>
                </div>
                <div className="bg-[#181822] border border-zinc-800 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-extrabold text-cyan-400 mb-1">100%</div>
                  <div className="text-xs text-zinc-400">Offline Ready</div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 10: SETTINGS SCREEN */}
          {currentScreen === 'settings' && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3 animate-fadeIn">
              <div className="flex items-center gap-3 py-2 mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Settings</h2>
              </div>

              <div className="bg-[#181822] border border-zinc-800 rounded-2xl p-4 mb-4 space-y-4">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Preferences</div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Appearance Theme</div>
                    <div className="text-[11px] text-zinc-400">Dark mode for accurate photo preview</div>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-300"
                  >
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Auto Save Projects</div>
                    <div className="text-[11px] text-zinc-400">Persist undo/redo history locally</div>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">Enabled</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Haptic Feedback</div>
                    <div className="text-[11px] text-zinc-400">Vibrate on slider snap and tool taps</div>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">Enabled</span>
                </div>
              </div>

              {/* Android APK Build Box */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-cyan-950/40 border border-indigo-500/30 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <div className="text-xs font-bold text-white">Android Studio APK Build</div>
                </div>
                <p className="text-[11px] text-zinc-300 mb-3 leading-relaxed">
                  The complete Kotlin + Jetpack Compose codebase is generated and ready to compile into `app-debug.apk` and `app-release.apk`.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadAndroidZip}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Project ZIP</span>
                  </button>
                  <button
                    onClick={() => setShowAndroidCodeModal(true)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium"
                  >
                    View Guide
                  </button>
                </div>
              </div>

              <div className="bg-[#181822] border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-400 space-y-1">
                <div className="font-semibold text-white">Photo Editor v1.0.0</div>
                <div>Native Android (Kotlin + Jetpack Compose) & React Web Studio</div>
                <div className="text-[11px] text-zinc-500 pt-1">All edits non-destructive. Offline capable.</div>
              </div>
            </div>
          )}

          {/* Android Navigation Bar Pill */}
          <div className="w-full h-4 flex items-center justify-center shrink-0 z-40">
            <div className="w-32 h-1 bg-zinc-700 rounded-full"></div>
          </div>
        </div>
      </main>

      {/* Google Drive Upload Mandatory Confirmation Dialog */}
      {driveConfirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181824] border border-zinc-800 max-w-sm w-full rounded-3xl p-6 text-zinc-100 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-2">Save to Google Drive?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              You are about to upload "{driveConfirmModal.name}" to your connected Google Drive account (
              {currentUser?.email || 'User'}). With your permission, this will create a new cloud photo backup.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDriveConfirmModal({ open: false, blob: null, name: '' })}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmUploadToDrive}
                disabled={isUploadingToDrive}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                {isUploadingToDrive ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Tools Notice Modal */}
      {aiNotice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181824] border border-zinc-800 max-w-sm w-full rounded-3xl p-6 text-zinc-100 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-2">AI Service Status</h3>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line mb-6">{aiNotice}</p>
            <button
              onClick={() => setAiNotice(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Android Code Explorer & APK Instructions Modal */}
      {showAndroidCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14141B] border border-zinc-800 max-w-2xl w-full max-h-[85vh] rounded-3xl p-6 text-zinc-100 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Android Studio APK Guide & Codebase</h3>
              </div>
              <button
                onClick={() => setShowAndroidCodeModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-zinc-300">
              <div className="bg-indigo-950/40 border border-indigo-700/50 p-4 rounded-2xl">
                <div className="font-bold text-indigo-300 mb-1">Building Real APKs (Debug & Release)</div>
                <p className="text-zinc-300 leading-relaxed">
                  All Android files requested are generated in the file system: `settings.gradle.kts`, `build.gradle.kts`, `app/src/main/AndroidManifest.xml`, CameraX helper, and Jetpack Compose screens.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-white text-sm">Step-by-Step Build Instructions:</div>
                <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
                  <li>
                    <strong className="text-white">Download the Project ZIP:</strong> Click the button below to get the ready-to-build Android Studio project.
                  </li>
                  <li>
                    <strong className="text-white">Open in Android Studio:</strong> File &gt; Open &gt; Select the unzipped folder. Let Gradle sync.
                  </li>
                  <li>
                    <strong className="text-white">Build APK:</strong> In Android Studio top menu, click:
                    <div className="bg-black/50 p-2 rounded-lg font-mono text-[11px] text-cyan-300 my-1">
                      Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
                    </div>
                  </li>
                  <li>
                    <strong className="text-white">Or via Terminal:</strong> Run:
                    <div className="bg-black/50 p-2 rounded-lg font-mono text-[11px] text-emerald-400 my-1">
                      ./gradlew assembleDebug
                    </div>
                  </li>
                  <li>
                    Output APK will be located at:
                    <div className="bg-black/50 p-2 rounded-lg font-mono text-[11px] text-amber-300 my-1">
                      app/build/outputs/apk/debug/app-debug.apk
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowAndroidCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Close
              </button>
              <button
                onClick={handleDownloadAndroidZip}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android ZIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
