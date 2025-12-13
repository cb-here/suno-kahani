import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Download,
} from "lucide-react";

export default function CustomAudioPlayer({ chunks }: any) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>(
    Array.from({ length: 30 }, (_, i) => 20 + Math.sin(i * 0.5) * 10),
  );
  const [fileName, setFileName] = useState("suno-kahani");

  const startPlayback = () => {
    if (!chunks.length) return;
    setCurrentChunk(0);
    loadChunk(0, true);
  };

  const loadChunk = (index: number, play: boolean) => {
    const audio = audioRef.current;
    if (!audio || !chunks[index]) return;

    audio.src = chunks[index].url;
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

  const downloadAudio = async () => {
    if (!chunks.length) return;

    try {
      // Helper function to parse WAV file
      const parseWav = (buffer: Uint8Array) => {
        const view = new DataView(buffer.buffer);

        // Read WAV header info
        const sampleRate = view.getUint32(24, true);
        const numChannels = view.getUint16(22, true);
        const bitsPerSample = view.getUint16(34, true);

        // Find data chunk (skip header)
        let dataOffset = 36;
        while (dataOffset < buffer.length - 8) {
          const chunkId = String.fromCharCode(
            ...buffer.slice(dataOffset, dataOffset + 4),
          );
          if (chunkId === "data") {
            break;
          }
          const chunkSize = view.getUint32(dataOffset + 4, true);
          dataOffset += 8 + chunkSize;
        }

        const dataSize = view.getUint32(dataOffset + 4, true);
        const audioData = buffer.slice(
          dataOffset + 8,
          dataOffset + 8 + dataSize,
        );

        return { sampleRate, numChannels, bitsPerSample, audioData };
      };

      // Helper function to create WAV header
      const createWavHeader = (
        dataSize: number,
        sampleRate: number,
        numChannels: number,
        bitsPerSample: number,
      ) => {
        const header = new Uint8Array(44);
        const view = new DataView(header.buffer);

        // "RIFF" chunk descriptor
        header.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
        view.setUint32(4, 36 + dataSize, true); // File size - 8
        header.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

        // "fmt " sub-chunk
        header.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(
          28,
          sampleRate * numChannels * (bitsPerSample / 8),
          true,
        ); // ByteRate
        view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
        view.setUint16(34, bitsPerSample, true);

        // "data" sub-chunk
        header.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
        view.setUint32(40, dataSize, true);

        return header;
      };

      // Parse all WAV chunks and extract audio data
      const parsedChunks = chunks.map((chunk: any) => parseWav(chunk.data));

      // Use first chunk's format info
      const { sampleRate, numChannels, bitsPerSample } = parsedChunks[0];

      // Concatenate all audio data
      const audioDataArrays = parsedChunks.map((chunk: any) => chunk.audioData);
      const totalAudioDataSize = audioDataArrays.reduce(
        (sum: any, arr: any) => sum + arr.length,
        0,
      );
      const mergedAudioData = new Uint8Array(totalAudioDataSize);

      let offset = 0;
      for (const audioData of audioDataArrays) {
        mergedAudioData.set(audioData, offset);
        offset += audioData.length;
      }

      // Create new WAV header with correct size
      const newHeader = createWavHeader(
        mergedAudioData.length,
        sampleRate,
        numChannels,
        bitsPerSample,
      );

      // Combine header + audio data
      const finalWav = new Uint8Array(
        newHeader.length + mergedAudioData.length,
      );
      finalWav.set(newHeader, 0);
      finalWav.set(mergedAudioData, newHeader.length);

      // Create blob and download
      const combinedBlob = new Blob([finalWav], { type: "audio/wav" });
      const url = URL.createObjectURL(combinedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}-${Date.now()}.wav`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading audio:", error);
    }
  };

  return (
    <div className="mt-8 w-full max-w-3xl mx-auto px-3 sm:px-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-xl sm:rounded-2xl shadow-2xl border border-indigo-500/20 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-indigo-500/10">
          <div className="flex items-center justify-between">
            <p className="text-white text-xs sm:text-sm font-medium">
              {chunks.length} {chunks.length === 1 ? "Part" : "Parts"}
            </p>
            {isPlaying && (
              <p className="text-indigo-300 text-xs">
                Playing {currentChunk + 1}/{chunks.length}
              </p>
            )}
          </div>
        </div>

        {/* Visualizer */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-end justify-center gap-0.5 sm:gap-1 h-16 sm:h-20">
            {waveHeights.map((height, i) => (
              <div
                key={i}
                className="w-1 sm:w-1.5 bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-500 rounded-full transition-all duration-150 shadow-sm"
                style={{
                  height: `${height}%`,
                  opacity: isPlaying ? 1 : 0.4,
                  animationDelay: `${i * 0.05}s`,
                  animation: isPlaying
                    ? "wave 0.8s ease-in-out infinite alternate"
                    : "none",
                  boxShadow: isPlaying
                    ? "0 0 8px rgba(99, 102, 241, 0.4)"
                    : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={skipBackward}
                className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95"
                title="Backward 10s"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 sm:p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="white"
                  />
                ) : (
                  <Play
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5"
                    fill="white"
                  />
                )}
              </button>

              <button
                onClick={skipForward}
                className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
              </button>
            </div>

            {/* Volume & Download - Responsive Layout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 sm:pt-3 border-t border-indigo-500/10">
              {/* Volume Control */}
              <div className="flex items-center gap-2 sm:flex-1">
                <button
                  onClick={toggleMute}
                  className="p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg transition-all flex-shrink-0"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-indigo-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-indigo-300" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={changeVolume}
                  className="flex-1 accent-indigo-500 h-1.5 rounded-full"
                  style={{
                    background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <span className="text-indigo-300 text-xs font-medium min-w-[2.5rem] text-right hidden sm:inline">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              {/* Download Section */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Filename"
                  className="flex-1 sm:flex-initial sm:w-32 md:w-40 px-3 py-2 bg-white/5 text-white placeholder-indigo-300/40 text-xs sm:text-sm rounded-lg border border-indigo-500/20 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all"
                />
                <button
                  onClick={downloadAudio}
                  disabled={!chunks.length}
                  className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:from-purple-700 active:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-1.5"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="text-white text-xs sm:text-sm font-medium hidden sm:inline">
                    Save
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <audio ref={audioRef} />
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1.2); }
        }

        /* Custom range slider styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(99, 102, 241), rgb(168, 85, 247));
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.4);
          transition: all 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(99, 102, 241, 0.6);
        }

        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(99, 102, 241), rgb(168, 85, 247));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.4);
          transition: all 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </div>
  );
}
