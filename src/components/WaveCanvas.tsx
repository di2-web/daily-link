import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WavePoint } from '../types';
import { analyzeMoodWavePoints } from '../lib/geminiApi';
import { supabaseGetWaveCanvas, supabaseSaveWaveCanvas } from '../lib/supabase';
import { Sparkles, RefreshCw, Check, Info, TrendingUp, Sun, Moon } from 'lucide-react';

interface WaveCanvasProps {
  currentUser: UserProfile;
  selectedDate: string;
  onWaveUpdated?: (points: WavePoint[], moodScore: number) => void;
}

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  currentUser,
  selectedDate,
  onWaveUpdated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<WavePoint[]>([]);
  const [peakInfo, setPeakInfo] = useState<{
    peakHour: number;
    peakType: string;
    insight: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize 24-hour default flat wave or load from Supabase
  useEffect(() => {
    const loadWave = async () => {
      try {
        const fetchedPoints = await supabaseGetWaveCanvas(currentUser.uid, selectedDate);
        if (Array.isArray(fetchedPoints) && fetchedPoints.length === 24) {
          setPoints(fetchedPoints);
          return;
        }
      } catch (err) {
        console.warn('Load wave error:', err);
      }

      // Default gentle sine curve
      const initial: WavePoint[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        mood: Math.round(Math.sin((i / 24) * Math.PI * 2) * 20),
      }));
      setPoints(initial);
    };

    loadWave();
  }, [currentUser.uid, selectedDate]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Background styling
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, width, height);

    // Grid horizontal lines (Positive, Neutral, Negative)
    ctx.strokeStyle = '#e7e2d9';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // +50 line
    const yTop = centerY - height * 0.35;
    ctx.beginPath();
    ctx.moveTo(0, yTop);
    ctx.lineTo(width, yTop);
    ctx.stroke();

    // Zero / Center Line
    ctx.strokeStyle = '#d3cbbe';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // -50 line
    const yBottom = centerY + height * 0.35;
    ctx.strokeStyle = '#e7e2d9';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yBottom);
    ctx.lineTo(width, yBottom);
    ctx.stroke();

    // Vertical Hour Markers (Every 3 hours)
    for (let h = 0; h <= 24; h += 3) {
      const x = (h / 24) * width;
      ctx.strokeStyle = '#eae5dc';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Hour text
      ctx.fillStyle = '#9e9689';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${h}:00`, Math.min(x + 2, width - 28), height - 8);
    }

    if (points.length < 2) return;

    // Draw Smooth Wave Line with Gradient Area
    ctx.setLineDash([]);
    const gradient = ctx.createLinearGradient(0, yTop, 0, yBottom);
    gradient.addColorStop(0, 'rgba(217, 119, 6, 0.25)'); // Warm Amber
    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)');
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.15)'); // Cool Blue

    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = (p.hour / 23) * width;
      const y = centerY - (p.mood / 100) * (height * 0.4);

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        const prev = points[idx - 1];
        const prevX = (prev.hour / 23) * width;
        const prevY = centerY - (prev.mood / 100) * (height * 0.4);
        const midX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
      }
    });

    // Stroke the line
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw interactive anchor dots
    points.forEach((p) => {
      const x = (p.hour / 23) * width;
      const y = centerY - (p.mood / 100) * (height * 0.4);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [points]);

  // Pointer Interaction for Canvas Swiping
  const updatePointFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const hour = Math.max(0, Math.min(23, Math.round((x / rect.width) * 23)));
    const centerY = rect.height / 2;
    const rawMood = ((centerY - y) / (rect.height * 0.4)) * 100;
    const clampedMood = Math.max(-100, Math.min(100, Math.round(rawMood)));

    setPoints((prev) => {
      const updated = [...prev];
      updated[hour] = { hour, mood: clampedMood };
      return updated;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    updatePointFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    updatePointFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Reset to flat
  const handleReset = () => {
    const flat: WavePoint[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      mood: 0,
    }));
    setPoints(flat);
  };

  // Save Wave and Analyze with AI
  const handleSaveWave = async () => {
    setSaving(true);
    try {
      const aiResult = await analyzeMoodWavePoints(points);
      setPeakInfo(aiResult);

      await supabaseSaveWaveCanvas(currentUser.uid, selectedDate, points);

      // Calculate current hour mood score for quick post
      const currentHour = new Date().getHours();
      const currentPoint = points.find((p) => p.hour === currentHour);
      if (onWaveUpdated && currentPoint) {
        onWaveUpdated(points, currentPoint.mood);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Save wave error:', err);
      alert('気分の波の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Card */}
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌊</span>
            <h2 className="text-xl font-bold text-stone-900">気分の波キャンバス</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            24時間の気分の高まりや落ち着きをスワイプして描くと、AIが思い出の重み付けに反映します
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>リセット</span>
          </button>
          <button
            onClick={handleSaveWave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition-colors shadow-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>保存完了</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>波を分析＆保存</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200/80 shadow-sm relative">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-2 font-medium">
          <span className="flex items-center gap-1 text-amber-700">
            <TrendingUp className="w-3.5 h-3.5" /> 感情ピーク・高揚 (+100)
          </span>
          <span className="text-stone-400">平常 (0)</span>
          <span className="flex items-center gap-1 text-sky-700">
            <Moon className="w-3.5 h-3.5" /> 落ち着き・休息 (-100)
          </span>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-stone-300/80 bg-[#faf8f5] touch-none">
          <canvas
            ref={canvasRef}
            width={800}
            height={260}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-56 sm:h-64 cursor-crosshair block"
          />
        </div>

        <p className="text-[11px] text-stone-400 text-center mt-2.5">
          👆 指またはマウスでなぞって24時間のバイオリズムを描いてください
        </p>
      </div>

      {/* AI Insight Card */}
      {peakInfo && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200/80 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200/60 flex items-center justify-center text-amber-800 shrink-0 text-lg">
            ✨
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">AIバイオリズム分析</h4>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              {peakInfo.insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
