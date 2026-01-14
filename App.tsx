
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Info, 
  Settings, 
  Maximize2, 
  Download, 
  Cpu, 
  Palette,
  FastForward,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { LottieMetadata, AnimationSettings } from './types';

// Declaring lottie globally since it's loaded via CDN in index.html
declare const lottie: any;

const App: React.FC = () => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [metadata, setMetadata] = useState<LottieMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [settings, setSettings] = useState<AnimationSettings>({
    loop: true,
    speed: 1,
    backgroundColor: '#ffffff',
    renderer: 'svg'
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const animationInstanceRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initAnimation = useCallback((data: any) => {
    if (animationInstanceRef.current) {
      animationInstanceRef.current.destroy();
    }

    if (containerRef.current && data) {
      animationInstanceRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: settings.renderer,
        loop: settings.loop,
        autoplay: true,
        animationData: data,
      });

      animationInstanceRef.current.setSpeed(settings.speed);
      setIsPlaying(true);
    }
  }, [settings.loop, settings.speed, settings.renderer]);

  useEffect(() => {
    if (animationData) {
      initAnimation(animationData);
    }
    return () => {
      if (animationInstanceRef.current) {
        animationInstanceRef.current.destroy();
      }
    };
  }, [animationData, initAnimation]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setAnimationData(json);
        setMetadata({
          name: file.name,
          size: file.size,
          fr: json.fr,
          ip: json.ip,
          op: json.op,
          w: json.w,
          h: json.h,
          layers: json.layers?.length || 0
        });
        setAnalysis(null);
      } catch (err) {
        alert("Failed to parse Lottie JSON. Please ensure it's a valid Lottie file.");
      }
    };
    reader.readAsText(file);
  };

  const handlePlayPause = () => {
    if (!animationInstanceRef.current) return;
    if (isPlaying) {
      animationInstanceRef.current.pause();
    } else {
      animationInstanceRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!animationInstanceRef.current) return;
    animationInstanceRef.current.stop();
    setIsPlaying(false);
  };

  const handleSpeedChange = (speed: number) => {
    setSettings(prev => ({ ...prev, speed }));
    if (animationInstanceRef.current) {
      animationInstanceRef.current.setSpeed(speed);
    }
  };

  const handleAnalyze = async () => {
    if (!animationData) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this Lottie animation JSON structure and metadata. 
                   Provide a short, technical summary of what this animation likely represents (e.g., loading spinner, character animation, UI transition). 
                   Mention the complexity based on ${metadata?.layers} layers and ${metadata?.fr} FPS.
                   JSON summary: ${JSON.stringify({
                     fr: animationData.fr,
                     w: animationData.w,
                     h: animationData.h,
                     layersCount: animationData.layers?.length,
                     v: animationData.v,
                     assetsCount: animationData.assets?.length
                   })}`,
      });
      setAnalysis(response.text || "Could not analyze the animation.");
    } catch (error) {
      console.error(error);
      setAnalysis("AI Analysis failed. Check your API key or network.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Play className="text-white w-5 h-5 fill-current" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">LottieFlow</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <Upload size={18} />
            <span className="font-medium">Upload JSON</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".json"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left: Preview Panel */}
        <section className="flex-1 flex flex-col gap-4">
          <div 
            className="relative flex-1 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden min-h-[400px] transition-all duration-300"
            style={{ backgroundColor: settings.backgroundColor }}
          >
            {!animationData ? (
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Upload className="text-slate-400 w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700">Drop a Lottie file here</h3>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">Upload large JSON files to preview them instantly with smooth playback.</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 text-blue-600 font-medium hover:underline"
                >
                  or browse files
                </button>
              </div>
            ) : (
              <div ref={containerRef} className="w-full h-full" />
            )}

            {/* Float Controls */}
            {animationData && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-white/40 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
                <button 
                  onClick={handlePlayPause}
                  className="p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button 
                  onClick={handleStop}
                  className="p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
                  title="Stop"
                >
                  <Square size={20} fill="currentColor" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button 
                  onClick={() => {
                    if (animationInstanceRef.current) {
                      animationInstanceRef.current.goToAndPlay(0);
                    }
                  }}
                  className="p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
                  title="Restart"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          {animationData && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center gap-8 justify-between">
               <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Palette size={12} /> Bg Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings(p => ({...p, backgroundColor: e.target.value}))}
                      className="w-10 h-8 rounded border-0 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-slate-600">{settings.backgroundColor.toUpperCase()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <FastForward size={12} /> Playback Speed
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0.25" 
                      max="4" 
                      step="0.25"
                      value={settings.speed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="w-32 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700 w-8">{settings.speed}x</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSettings(p => ({...p, loop: !p.loop}))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    settings.loop 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  Looping: {settings.loop ? 'ON' : 'OFF'}
                </button>
                
                <select 
                  value={settings.renderer}
                  onChange={(e) => setSettings(p => ({...p, renderer: e.target.value as any}))}
                  className="bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="svg">SVG Renderer</option>
                  <option value="canvas">Canvas Renderer</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Right: Info Panel */}
        <aside className="w-full lg:w-[400px] flex flex-col gap-6">
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Info className="text-blue-600" size={20} />
              Animation Inspector
            </h3>
            
            {!metadata ? (
              <div className="text-slate-400 text-sm italic">
                No file loaded to inspect.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Width" value={`${metadata.w}px`} icon={<Maximize2 size={14} />} />
                  <Stat label="Height" value={`${metadata.h}px`} icon={<Maximize2 size={14} />} />
                  <Stat label="FPS" value={metadata.fr} icon={<Cpu size={14} />} />
                  <Stat label="Layers" value={metadata.layers} icon={<Settings size={14} />} />
                  <Stat label="Frames" value={`${metadata.ip} - ${metadata.op}`} icon={<FastForward size={14} />} />
                  <Stat label="File Size" value={`${(metadata.size / 1024).toFixed(2)} KB`} icon={<Download size={14} />} />
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Sparkles size={18} />
                        AI Analysis
                      </>
                    )}
                  </button>

                  {analysis && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                      {analysis}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl">
            <h4 className="font-bold text-white mb-3">Pro Tips</h4>
            <ul className="text-sm text-slate-400 space-y-3">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Canvas renderer is better for complex animations with thousands of shapes.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>JSON files up to 50MB can be previewed without lag on most modern browsers.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Check the "Layers" count to gauge performance impact on mobile devices.</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 px-6 py-4 mt-auto text-center text-slate-400 text-xs">
        &copy; 2024 LottieFlow. Built with React, Tailwind, and lottie-web.
      </footer>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
      {icon}
      {label}
    </div>
    <div className="text-sm font-bold text-slate-800">{value}</div>
  </div>
);

export default App;
