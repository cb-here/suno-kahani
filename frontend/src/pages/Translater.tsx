"use client";
import { useState } from "react";
import Button from "../components/form/Button";
import TextArea from "../components/form/TextArea";

export default function Translater() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

    try {
      const res = await fetch("http://localhost:4000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
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

        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800/50 shadow-xl">
          <TextArea
            label="Enter text to translate"
            placeholder="Type here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
          />

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
