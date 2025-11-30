import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function CustomAudioPlayer({ chunks }: any) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const startPlayback = () => {
    if (!chunks.length) return;
    setCurrentChunk(0);
    loadChunk(0, true);
  };

  const loadChunk = (index: number, play: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!chunks[index]) return;

    audio.src = chunks[index];
    audio.load();

    if (play) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
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

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [currentChunk, chunks]);

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

  const skip = (sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(
      0,
      Math.min(duration, audio.currentTime + sec)
    );
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

  return (
    <div className="mt-10 max-w-2xl mx-auto px-3">
      <div
        className="
      bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg 
      px-4 py-4 
      flex flex-col gap-6
      sm:flex-row sm:items-center sm:gap-6
    "
      >
        {/* Left: Play Button */}
        <button
          onClick={togglePlay}
          className="
        p-3 
        bg-gradient-to-r from-purple-500 to-pink-500 
        rounded-full shadow-md 
        hover:scale-110 transition
        sm:p-4
      "
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white sm:w-6 sm:h-6" />
          ) : (
            <Play className="w-5 h-5 text-white sm:w-6 sm:h-6" />
          )}
        </button>

        {/* Middle: Progress + Info */}
        <div className="flex-1 w-full">
          <div className="flex justify-between text-gray-400 text-[10px] sm:text-xs mb-1">
            <span>
              Chunk {currentChunk + 1}/{chunks.length}
            </span>
            <span>
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
          </div>

          <div className="h-2 bg-gray-700/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            ></div>
          </div>
        </div>

        {/* Jump */}
        <div className="flex items-center gap-3 justify-center sm:justify-start">
          <button
            onClick={() => skip(-10)}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition sm:p-3"
          >
            <SkipBack className="w-4 h-4 text-white sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => skip(10)}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition sm:p-3"
          >
            <SkipForward className="w-4 h-4 text-white sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 justify-center sm:ml-4">
          <button
            onClick={toggleMute}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition sm:p-3"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white sm:w-5 sm:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 text-white sm:w-5 sm:h-5" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={changeVolume}
            className="w-20 sm:w-24 accent-purple-500"
          />
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}
