import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";

interface CustomAudioPlayerProps {
  audioUrl: string;
}

export default function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: { target: { value: string; }; }) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: { target: { value: string; }; }) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setVolume(volume || 0.5);
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, currentTime + seconds)
    );
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="\flex items-center justify-center mt-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg flex items-center justify-center">
                <div
                  className={`w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                >
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-white truncate">
                  Your Audio Track
                </h3>
                <p className="text-sm text-white/60">Now Playing</p>
              </div>

              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <div className="flex justify-between text-white/60 text-xs mt-1.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => skip(-10)}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <SkipBack className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" />
                  ) : (
                    <Play
                      className="w-5 h-5 text-white ml-0.5"
                      fill="currentColor"
                    />
                  )}
                </button>

                <button
                  onClick={() => skip(10)}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <SkipForward className="w-4 h-4 text-white" />
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #fff 0%, #fff ${
                        (isMuted ? 0 : volume) * 100
                      }%, rgba(255,255,255,0.2) ${
                        (isMuted ? 0 : volume) * 100
                      }%, rgba(255,255,255,0.2) 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <audio ref={audioRef} src={audioUrl} />
        </div>
      </div>
    </div>
  );
}
