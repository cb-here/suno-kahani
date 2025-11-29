import { useState } from "react";
import Button from "../components/form/Button";
import TextArea from "../components/form/TextArea";
import CustomAudioPlayer from "../components/CustomAudioPlayer";

const VOICES = [
  { id: "hi-IN-MadhurNeural", name: "Madhur (Male – Deep)" },
  { id: "en-IN-NeerjaNeural", name: "Neerja (Hinglish Female)" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return alert("Kahani daal bhai");

    setIsGenerating(true);
    setAudioUrl(null);

    const audioQueue: string[] = [];
    let currentAudio: HTMLAudioElement | null = null;

    const playNext = () => {
      if (audioQueue.length === 0) {
        setIsGenerating(false);
        return;
      }

      const nextUrl = audioQueue.shift()!;
      setAudioUrl(nextUrl);

      currentAudio = new Audio(nextUrl);
      currentAudio.onended = () => {
        URL.revokeObjectURL(nextUrl);
        playNext();
      };

      currentAudio.play().catch(() => {
        playNext();
      });
    };

    try {
      const startRes = await fetch("http://localhost:4000/start-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
        }),
      });

      const { streamId } = await startRes.json();

      const eventSource = new EventSource(
        `http://localhost:4000/stream/${streamId}`
      );

      eventSource.onmessage = (event) => {
        if (event.data.includes("finished")) {
          eventSource.close();
          if (audioQueue.length === 0 && !currentAudio) {
            setIsGenerating(false);
          }
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            const binary = atob(data.audio);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);

            audioQueue.push(url);

            if (!currentAudio) {
              playNext();
            }
          }
        } catch (e) {
          console.log("Ignore:", e);
        }
      };

      eventSource.onerror = () => {
        console.log("Stream band ho gaya");
        eventSource.close();
        setIsGenerating(false);
      };
    } catch (err) {
      console.error(err);
      alert("Server nahi chal raha bhai");
      setIsGenerating(false);
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

        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800/50 shadow-xl dark:shadow-2xl">
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

          <div className="flex flex-col sm:flex-row gap-4 items-center!">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer"
              >
                {VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

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
          </div>
        </div>

        {audioUrl && <CustomAudioPlayer audioUrl={audioUrl} />}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-lg">
            <div className="text-3xl mb-2">🎙️</div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">
              Multiple Voices
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Choose from diverse voice options to match your story's mood
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
              Cutting-edge technology for natural-sounding audio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
