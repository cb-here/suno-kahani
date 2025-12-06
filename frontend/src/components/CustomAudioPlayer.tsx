import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from "lucide-react";

export default function CustomAudioPlayer({ chunks }: any) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>(
    Array.from({ length: 30 }, (_, i) => 20 + Math.sin(i * 0.5) * 10)
  );

  const startPlayback = () => {
    if (!chunks.length) return;
    setCurrentChunk(0);
    loadChunk(0, true);
  };

  const loadChunk = (index: number, play: boolean) => {
    const audio = audioRef.current;
    if (!audio || !chunks[index]) return;

    audio.src = chunks[index];
    audio.load();

    if (play) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const next = currentChunk + 1;
      if (next < chunks.length) {
        setCurrentChunk(next);
        loadChunk(next, true);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentChunk, chunks]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setWaveHeights(Array.from({ length: 30 }, () => Math.random() * 60 + 40));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying && currentChunk === 0 && !audio.src) {
      startPlayback();
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const changeVolume = (e: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    const v = parseFloat(e.target.value);
    audio.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

  return (
    <div className="mt-8 max-w-2xl mx-auto px-3">
      <div className="bg-slate-900/90 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-xl px-6 py-4">
        {/* Audio Info */}
        <div className="text-center mb-3">
          <p className="text-cyan-400 text-sm font-medium">
            {chunks.length} Parts {isPlaying && `| Playing  ${currentChunk + 1}`}
          </p>
        </div>

        
        <div className="flex items-center justify-center gap-1 h-16 mb-4">
          {waveHeights.map((height, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-emerald-400 to-teal-300 rounded-full transition-all duration-150 shadow-sm"
              style={{
                height: `${height}%`,
                animationDelay: `${i * 0.05}s`,
                animation: isPlaying ? 'wave 0.8s ease-in-out infinite alternate' : 'none',
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Playback Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Skip Backward 10s */}
            <button
              onClick={skipBackward}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200"
              title="Backward 10s"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-lg hover:scale-105 transition-all duration-200"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={skipForward}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-cyan-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={changeVolume}
              className="w-24 sm:w-20 accent-cyan-500 h-1.5"
            />
          </div>
        </div>

        <audio ref={audioRef} />
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}
