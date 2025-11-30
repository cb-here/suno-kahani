"use client";
import { useState } from "react";
import Button from "../components/form/Button";
import TextArea from "../components/form/TextArea";

export default function Translater() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mode, setMode] = useState("hinglish");

  const handleCopied = async () => {
    setIsCopied(false);
    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
    } catch (err) {
      console.log(err);
    } finally {
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setOutput("");

    // eslint-disable-next-line no-misleading-character-class
    const cleanedText = text.replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, "");

    const endpoint = mode === "english" ? "/translate/english" : "/translate";

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText }),
      });

      const data = await res.json();
      setOutput(data.translated || "Error ho gaya");
    } catch {
      setOutput("Server off hai kya?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-2 bg-linear-to-br from-white via-gray-50 to-gray-100 dark:from-[#181515] dark:via-[#0f0d0d] dark:to-[#181515]">
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-4 bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Hindi Translator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Convert any text to Devanagari Hindi
          </p>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-3 sm:p-8 border border-gray-200 dark:border-gray-800/50 shadow-xl">
          <TextArea
            label="Enter text to translate"
            placeholder="Type here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Translation Mode
            </label>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="hinglish">
                Hinglish → Hindi (Transliteration)
              </option>
              <option value="english">English → Hindi (Translation)</option>
            </select>
          </div>

          <Button
            onClick={handleTranslate}
            variant="primary"
            size="md"
            isLoading={loading}
            disabled={!text.trim()}
            className="w-full mt-4"
          >
            Translate
          </Button>
        </div>

        {output && (
          <div className="mt-8 bg-white/70 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800/50 shadow-lg p-6 rounded-xl relative">
            <button
              onClick={handleCopied}
              disabled={isCopied}
              className="absolute top-4 right-4 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition"
            >
              {isCopied ? "Copied!" : "Copy"}
            </button>

            <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
              Hindi (Devanagari)
            </h3>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
