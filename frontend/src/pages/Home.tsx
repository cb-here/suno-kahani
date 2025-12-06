import { useRef, useState } from "react";
import Button from "../components/form/Button";
import TextArea from "../components/form/TextArea";
import CustomAudioPlayer from "../components/CustomAudioPlayer";
import { Download } from "lucide-react";

export default function Home() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("pratham");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const eventRef = useRef<EventSource | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return alert("Kahani daal bhai");

    setIsGenerating(true);
    setChunks([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tts/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        alert("Streaming not supported");
        setIsGenerating(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const audioChunks: string[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                console.error("Server error:", data.error);
                alert(`Error: ${data.error}`);
                continue;
              }

              if (data.done) {
                setIsGenerating(false);
                continue;
              }

              if (data.audio) {
                const binary = atob(data.audio);
                const arr = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  arr[i] = binary.charCodeAt(i);
                }

                const blob = new Blob([arr], { type: "audio/wav" });
                const url = URL.createObjectURL(blob);

                audioChunks.push(url);
                setChunks([...audioChunks]);
              }
            } catch (parseErr) {
              console.error("Failed to parse SSE data:", line, parseErr);
            }
          }
        }
      }

      setIsGenerating(false);
    } catch (err: any) {
      console.error("Fetch error:", err);
      alert(`Error: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (eventRef.current) {
      eventRef.current.close();
      eventRef.current = null;
    }
    setIsGenerating(false);
  };

  const handleDownload = async () => {
    if (!text.trim()) return alert("Kahani daal bhai");

    setIsDownloading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tts/download`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `suno-kahani-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error("Download error:", error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-2 bg-linear-to-br from-white via-gray-50 to-gray-100 dark:from-[#181515] dark:via-[#0f0d0d] dark:to-[#181515]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-40 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-4 bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Suno Kahani
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Transform your text into beautiful AI-generated audio
          </p>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-3 sm:p-8 border border-gray-200 dark:border-gray-800/50 shadow-xl dark:shadow-2xl">
          <div className="mb-6">
            <TextArea
              label="Enter your story or text"
              placeholder="Write something amazing... your story will come to life!"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="focus:border-purple-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Voice
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="pratham">Pratham</option>
              <option value="rohan">Rohan</option>
              <option value="priyamvada">Priyamvada</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center!">
            <div className="w-full sm:w-auto mt-6">
              <Button
                onClick={handleGenerate}
                variant="primary"
                size="md"
                isLoading={isGenerating}
                disabled={!text.trim()}
                className="w-full"
              >
                Generate
              </Button>
            </div>
            <Button
              onClick={handleStop}
              variant="danger"
              size="md"
              disabled={!isGenerating}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white mt-6"
            >
              Stop
            </Button>
            <Button
              onClick={handleDownload}
              size="md"
              disabled={!text.trim() || isDownloading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white mt-6 flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {chunks?.length > 0 && <CustomAudioPlayer chunks={chunks} />}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-lg">
            <div className="text-3xl mb-2">🎙️</div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">
              Natural Narration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Professionally tuned Piper voice for story narration
            </p>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-lg">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">
              Instant Generation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get high-quality audio output in seconds
            </p>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-lg">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">
              AI Powered
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Smooth, expressive narration using Piper TTS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
