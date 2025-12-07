import { useRef, useState } from "react";
import TextArea from "../components/form/TextArea";
import Button from "../components/form/Button";
import CustomAudioPlayer from "../components/CustomAudioPlayer";

export default function Home() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("hindi");
  const [voice, setVoice] = useState("pratham");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chunks, setChunks] = useState<any>([]);
  const eventRef = useRef<any>(null);

  const voiceOptions: any = {
    hindi: [
      { value: "pratham", label: "Pratham" },
      { value: "rohan", label: "Rohan" },
      { value: "priyamvada", label: "Priyamvada" },
    ],
    english: [
      { value: "ryan", label: "Ryan" },
      { value: "kristin", label: "Kristin" },
    ],
  };

  // Handle language change and reset voice to first option
  const handleLanguageChange = (newLanguage: any) => {
    setLanguage(newLanguage);
    setVoice(voiceOptions[newLanguage][0].value);
  };

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
        },
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
      const audioChunks = [];
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

  return (
    <div className="min-h-screen py-12 px-2 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-40 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Language
            </label>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => handleLanguageChange("hindi")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  language === "hindi"
                    ? "bg-purple-600 text-white shadow-lg scale-105"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Hindi
              </button>
              <button
                onClick={() => handleLanguageChange("english")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  language === "english"
                    ? "bg-purple-600 text-white shadow-lg scale-105"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                English
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Voice
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {voiceOptions[language].map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleGenerate}
              variant="primary"
              size="md"
              isLoading={isGenerating}
              disabled={!text.trim()}
              className="w-full sm:w-auto"
            >
              Generate
            </Button>
            <Button
              onClick={handleStop}
              variant="danger"
              size="md"
              disabled={!isGenerating}
              className="w-full sm:w-auto"
            >
              Stop
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
